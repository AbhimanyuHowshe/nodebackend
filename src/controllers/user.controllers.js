import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefereshTokens = async (userId) => {
    try {
        const user = await User.findById(userId); // Added 'await' here
        const accessToken = user.generateAccessToken(); // Assuming generateAccessToken is defined
        const refreshToken =user.generateRefreshToken(); // Assuming generateRefreshToken is defined
        user.refreshToken = refreshToken;
         await user.save({ validateBeforeSave: false });
        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Access token and refresh token not generated");
    }
}
const registerUser = asyncHandler(async (req, res) => {
    try {
        const { fullName, email, username, password } = req.body;

        if ([fullName, email, username, password].some((field) => field?.trim() === "")) {
            throw new ApiError(400, "All fields are required");
        }

        const existedUser = await User.findOne({ $or: [{ username }, { email }] });

        if (existedUser) {
            throw new ApiError(409, "User with email or username already exists");
        }

        const avatarLocalPath = req.files?.avatar[0]?.path;

        let coverImageLocalPath;

        if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
            coverImageLocalPath = req.files.coverImage[0].path;
        }

        if (!avatarLocalPath) {
            throw new ApiError(400, "Avatar file is required");
        }

        const avatar = await uploadOnCloudinary(avatarLocalPath);
        const coverImage = await uploadOnCloudinary(coverImageLocalPath);

        if (!avatar) {
            throw new ApiError(400, "Avatar file is required");
        }

        const user = await User.create({
            fullName,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
            email,
            password,
            username: username.toLowerCase()
        });

        const createdUser = await User.findById(user._id).select("-password -refreshToken");

        if (!createdUser) {
            throw new ApiError(500, "Something went wrong while registering the user");
        }

        return res.status(201).json(new ApiResponse(200, createdUser, "User registered Successfully"));
    } catch (error) {
        next(error); // Assuming 'next' is defined in your middleware
    }
});

// login controller
const loginUser = asyncHandler(async (req, res, next) => {
    try {
        const { email, username, password } = req.body;

        if (!(username || email)) {
            throw new ApiError(400, "Username and email required");
        }

        const user = await User.findOne({ $or: [{ username }, { email }] });

        if (!user) {
            throw new ApiError(400, "User does not exist");
        }

        const isPasswordValid = await user.isPasswordCorrect(password);

        if (!isPasswordValid) {
            throw new ApiError(401, "Enter correct password");
        }

        const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id);
        const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

        const options = {
            httpOnly: true,
            secure: true
        };

        res.status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "User logged in successfully"));
    } catch (error) {
        next(error); // Pass the error to the next middleware
    }
});

const logoutUser = asyncHandler(async (req, res, next) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    );

    const options = {
        httpOnly: true,
        secure: true
    };

    res
        .status(200)
        .clearCookie("refreshToken", options) // Fixed 'refreshToken' to a string
        .clearCookie("accessToken", options) // Fixed 'accessToken' to a string
        .json(new ApiResponse(200, {}, "User logged out"));
});
const refreshAccessToken = asyncHandler (async(req,res,next) => { 
    const incomeingRefreshToken = req.cookies.refreshToken  || req.body.refreshToken;
    if(!incomeingRefreshToken){
        throw new ApiError(401, " Unauthorised access");
    }
  try {
     const decodedToken =  jwt.verify(
          incomeingRefreshToken,
          process.env.REFRESH_TOKEN_SECRET
      )
      const user = await User.findById(decodedToken?._id);
      if(!user){
          throw new ApiError(401 , " Invalid refresh token");
      }
      if( incomeingRefreshToken !== user.refreshToken){
          throw new ApiError( 401 , " Refresh token is expired or used")
      }
      const options ={
          httpOnly : true,
          secure : true
      }
      const {accessToken, newRefreshToken } = await generateAccessAndRefereshTokens(user._id);
      return  res.status(200)
       .cookie("accessToken", accessToken,options)
       .cookie("refreshToken", newRefreshToken,options)
       .json(200,{
          accessToken, refreshToken :newRefreshToken},
          "Access token refreshed"
  
       )
  } catch (error) {
      throw new ApiError(401, error?.message ||" Invalid refresh token ");
  }
})

const changeCurrentPassword = asyncHandler(async(req,res)=>{
      const {oldPassword,newPassword} = req.body;
      const user = await User.findById(user?._id);
    const isPasswordCorrect=   await user.isPasswordCorrect(oldPassword);
    if(!isPasswordCorrect){
        throw new ApiError(401, "Invalid old password");
    }

    user.password = newPassword;
    await user.save({validateBeforeSave :false});
    return res.status(200)
    .json(new ApiResponse(200, " Password changed successfully"))
})

 const getCurrentUser = asyncHandler( async(req,res)=>{
    return res.status(200)
    .json(new ApinResponse(200, req.user,"Current user fetched"));
 })

 const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {fullName , email} = req.body;
    if(!fullName || !email ){
        throw new ApiError(401, " Both email and Fullname required");
    }
    const user = User.findByIdAndUpdate(
        user?._id,
        {
           $set : {
            fullName : fullName,
            email  :email,
           }
        },
        {new : true}).select("-password");

        return res.status(200)
        .json(new ApiResponse(200,user, " Account details are updated"))
 })
 const updateUserAvatar = asyncHandler(async(req,res)=>{
     const avatarLocalPath = req.file?.path;
     if(!avatarLocalPath){
        throw new ApiError(400, " Avatar file is missing");
     }
    const avatar =  await uploadOnCloudinary(avatarLocalPath);
    if(!avatar.url){
        throw new ApiError(400, "Error while uploading avatar");
    }
    const user = await User.findByIdAndUpdate(req.user?._id
        {
            $set :{
                avatar :avatar.url
            }
        },
        {
            new : true
        }).select("-password");
        return res.status(200)
        .json(new ApiResponse(200, user , "Avatar is updated successfully"));
 })
 const updateUserCoverImage = asyncHandler(async(req,res)=>{
      const coverImageLocalPath = req.file?.path;
      if(!coverImageLocalPath){
        throw new ApiError(400, "CoverImage file missing");
      }
      const coverImage = await uploadOnCloudinary(coverImageLocalPath);
      if(!coverImage.url){
        throw new ApiError(400, "Error uploading coverImage");
       }
       const user =await findByIdAndUpdate(req.user?.id,
        {
            $set :{
                coverImage :coverImage.url
            }
        },
        {
            new: true
        }).select("-password");

        return res.status(200)
        .json(new ApiResponse(200,user,"Cover image updated");)
       
 })
 
export { registerUser, loginUser,
     logoutUser, refreshAccessToken,
     changeCurrentPassword,
     getCurrentUser, updateAccountDetails,
     updateUserAvatar,
    updateUserCoverImage};
