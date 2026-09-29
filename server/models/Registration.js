const mongoose=require("mongoose");
const schema=new mongoose.Schema({
  student:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},
  event:{type:mongoose.Schema.Types.ObjectId,ref:"Event",required:true},
  status:{type:String,enum:["registered","cancelled"],default:"registered"},
  registeredAt:{type:Date,default:Date.now}
},{timestamps:true});
schema.index({student:1,event:1},{unique:true});
module.exports=mongoose.model("Registration",schema);
