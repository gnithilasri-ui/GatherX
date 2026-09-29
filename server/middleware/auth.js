const jwt=require("jsonwebtoken");
const User=require("../models/User");

async function protect(req,res,next){
  try{
    const h=req.headers.authorization;
    if(!h?.startsWith("Bearer ")) return res.status(401).json({success:false,message:"Login required"});
    const decoded=jwt.verify(h.split(" ")[1],process.env.JWT_SECRET);
    const user=await User.findById(decoded.id).select("-password");
    if(!user) return res.status(401).json({success:false,message:"User not found"});
    req.user=user; next();
  }catch(e){res.status(401).json({success:false,message:"Invalid or expired token"});}
}
const allow=(...roles)=>(req,res,next)=>{
  if(!roles.includes(req.user?.role)) return res.status(403).json({success:false,message:"Permission denied"});
  next();
};
module.exports={protect,allow};
