 import mongoose, {Schema} from "mongoose";

const subsciptionSchema = new Schema({
    subscriber : Schema.Types.ObjectId, // one who is subscribing
    ref : "User"

},{
    channel : Schema.Types.ObjectId,
    ref :"User"
},{
    timestamps :true
})





export const Subsciption = model.Schema('Subsciption', subsciptionSchema)


