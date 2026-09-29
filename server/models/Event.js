const mongoose = require("mongoose");
const eventSchema = new mongoose.Schema({
  title:{type:String,required:true,trim:true},
  description:{type:String,required:true,trim:true},
  category:{type:String,required:true,trim:true},
  type:{type:String,default:"Workshop",trim:true},
  date:{type:Date,required:true},
  time:{type:String,required:true},
  location:{type:String,required:true,trim:true},
  capacity:{type:Number,required:true,min:1},
  organizer:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},
  status:{type:String,enum:["published","cancelled"],default:"published"}
},{timestamps:true});
module.exports=mongoose.model("Event",eventSchema);
