const router=require("express").Router();
const bcrypt=require("bcryptjs");
const jwt=require("jsonwebtoken");
const User=require("../models/User");
const {protect}=require("../middleware/auth");

const token=u=>jwt.sign({id:u._id.toString(),role:u.role},process.env.JWT_SECRET,{expiresIn:"7d"});
const safe=u=>({id:u._id,name:u.name,email:u.email,role:u.role});

router.post("/register",async(req,res,next)=>{
  try{
    const {name,email,password,role="student"}=req.body;
    if(!name||!email||!password) return res.status(400).json({success:false,message:"Name, email and password are required"});
    if(password.length<6) return res.status(400).json({success:false,message:"Password must contain at least 6 characters"});
    if(await User.findOne({email:email.toLowerCase()})) return res.status(409).json({success:false,message:"Email already registered"});
    const safeRole=["student","organizer"].includes(role)?role:"student";
    const u=await User.create({name,email:email.toLowerCase(),password:await bcrypt.hash(password,10),role:safeRole});
    res.status(201).json({success:true,token:token(u),user:safe(u)});
  }catch(e){next(e)}
});

router.post("/login",async(req,res,next)=>{
  try{
    const {email,password}=req.body;
    const u=await User.findOne({email:email?.toLowerCase()});
    if(!u||!(await bcrypt.compare(password||"",u.password))) return res.status(401).json({success:false,message:"Invalid email or password"});
    res.json({success:true,token:token(u),user:safe(u)});
  }catch(e){next(e)}
});
router.get("/me",protect,(req,res)=>res.json({success:true,user:safe(req.user)}));
module.exports=router;
