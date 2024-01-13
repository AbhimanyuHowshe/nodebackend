import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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

export { registerUser, loginUser, logoutUser };
