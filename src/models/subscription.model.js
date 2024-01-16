 import mongoose, {Schema} from "mongoose";

const subscriptionSchema = new Schema({
    subscriber : Schema.Types.ObjectId, // one who is subscribing
    ref : "User"

},{
    channel : Schema.Types.ObjectId,
    ref :"User"
},{
    timestamps :true
})





export const Subscription = model.Schema('Subsciption', subscriptionSchema)


