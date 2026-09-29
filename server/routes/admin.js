const router=require("express").Router();
const User=require("../models/User");
const Event=require("../models/Event");
const Registration=require("../models/Registration");
const {protect,allow}=require("../middleware/auth");
router.use(protect,allow("admin"));
router.get("/dashboard",async(req,res,next)=>{
  try{
    const [users,events,registrations]=await Promise.all([User.countDocuments(),Event.countDocuments(),Registration.countDocuments({status:"registered"})]);
    res.json({success:true,stats:{users,events,registrations}});
  }catch(e){next(e)}
});
router.get("/users",async(req,res,next)=>{try{res.json({success:true,users:await User.find().select("-password").sort({createdAt:-1})})}catch(e){next(e)}});
router.get("/events",async(req,res,next)=>{try{res.json({success:true,events:await Event.find().populate("organizer","name email").sort({createdAt:-1})})}catch(e){next(e)}});
router.delete("/events/:id",async(req,res,next)=>{try{await Registration.deleteMany({event:req.params.id});const e=await Event.findByIdAndDelete(req.params.id);if(!e)return res.status(404).json({success:false,message:"Event not found"});res.json({success:true,message:"Event removed"})}catch(e){next(e)}});
module.exports=router;
