const router=require("express").Router();
const Registration=require("../models/Registration");
const Event=require("../models/Event");
const {protect,allow}=require("../middleware/auth");

router.post("/:eventId",protect,allow("student"),async(req,res,next)=>{
  try{
    const e=await Event.findById(req.params.eventId);
    if(!e||e.status!=="published")return res.status(404).json({success:false,message:"Event unavailable"});
    const existing=await Registration.findOne({student:req.user._id,event:e._id,status:"registered"});
    if(existing)return res.status(409).json({success:false,message:"Already registered"});
    const count=await Registration.countDocuments({event:e._id,status:"registered"});
    if(count>=e.capacity)return res.status(409).json({success:false,message:"Event is full"});
    const r=await Registration.findOneAndUpdate(
      {student:req.user._id,event:e._id},
      {student:req.user._id,event:e._id,status:"registered",registeredAt:new Date()},
      {upsert:true,new:true,setDefaultsOnInsert:true}
    ).populate("event");
    res.status(201).json({success:true,message:"Registration successful",registration:r});
  }catch(e){next(e)}
});

router.get("/mine",protect,allow("student"),async(req,res,next)=>{
  try{res.json({success:true,registrations:await Registration.find({student:req.user._id,status:"registered"}).populate("event").sort({registeredAt:-1})})}
  catch(e){next(e)}
});

router.delete("/:eventId",protect,allow("student"),async(req,res,next)=>{
  try{
    const r=await Registration.findOneAndUpdate({student:req.user._id,event:req.params.eventId,status:"registered"},{status:"cancelled"},{new:true});
    if(!r)return res.status(404).json({success:false,message:"Registration not found"});
    res.json({success:true,message:"Registration cancelled"});
  }catch(e){next(e)}
});

router.get("/event/:eventId/participants",protect,allow("organizer","admin"),async(req,res,next)=>{
  try{
    const e=await Event.findById(req.params.eventId);
    if(!e)return res.status(404).json({success:false,message:"Event not found"});
    if(req.user.role!=="admin"&&e.organizer.toString()!==req.user._id.toString()) return res.status(403).json({success:false,message:"Not your event"});
    const p=await Registration.find({event:e._id,status:"registered"}).populate("student","name email").sort({registeredAt:1});
    res.json({success:true,event:{id:e._id,title:e.title,capacity:e.capacity},participants:p});
  }catch(e){next(e)}
});
module.exports=router;
