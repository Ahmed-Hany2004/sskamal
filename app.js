const express =require("express");
const { MongoClient,ObjectId } = require('mongodb');
const server =express();
const bodyparser=require("body-parser")
const morgan = require("morgan");
const multer = require("multer");
require("dotenv").config();
var path = require('path');
const fs = require("fs")


const url =process.env.MONGO_URL;
const db_name =process.env.db_name;

server.use(bodyparser.urlencoded({ extended: true }))
server.use(bodyparser.json())
server.use(morgan("dev"));
server.use(express.static(path.join(__dirname,"./upload")))
server.use(cors())

var db =null;

//DB connection 
async function DBconnect() {
  // Use connect method to connect to the server
  try{
  console.log('start connection');
  const client = new MongoClient(url); 
  await client.connect();
  db = client.db(db_name);
  console.log('Connected successfully to server');
  }catch(err){
    console.log("=========>"+err);
  }

  // the following code examples can be pasted here...
  server.listen(3000,()=>console.log("sever run________"));
  return 'done.';
}





const storage = multer.diskStorage({
    destination: "upload",
    filename: function (req, file, cb) {
     
      cb(null, file.originalname  )
    }
  })

  const upload = multer({ storage: storage })
  
 
  module.exports=  {
    upload,
  };






  

  const cloudinary =require("cloudinary");


cloudinary.config({
    cloud_name: process.env.cloud_name,
    api_key: process.env.cloud_key,
    api_secret: process.env.cloud_secrit
}) 

cloud_uplod = async(filetouploud)=>{
try{
    const data = cloudinary.uploader.upload(filetouploud,{
        resours_type:"auto",
    });
    return data; 

}catch(err){
    return err;
}
}



cloud_remove = async(publicid)=>{
    
    try{
    
        const data = await cloudinary.uploader.destroy(publicid);
        
        return data; 
    
    }catch(err){
        return err;
    }
    }



server.get("/",async(req,res)=>{
  const user = db.collection('user');
  try{
   data = await user.find().toArray();
  res.status(200).json({data:data});
  }
  catch(err){
    console.log("=========>"+err);
    res.send("err")
  }
   
})



server.post("/",upload.single("img"),async(req,res)=>{
  const user = db.collection('user');
  try{
    if(req.file){

      const pathimg = path.join(__dirname, "./upload/" + req.file.originalname)

    const result = await cloud_uplod(pathimg)



    await user.insertOne({
      "link1":req.body.link1,
      "link2":req.body.link2,
      "img": {
        "url": result.secure_url,
        "image_publicid": result.public_id,
        "originalname": req.file.originalname,
      },
      "icons":req.body.icons,
     "category":req.body.category,
     more1:null,
more2:null,
more3:"",
more4:"",
      
    })

   

    fs.unlinkSync(pathimg)

    }
    else{
      await user.insertOne({
        "link1":req.body.link1,
        "link2":req.body.link2,
        "profile_image": {
          "url": null,
          "image_publicid": null,
          "originalname": null,
        },
        "icons":req.body.icons,
       "category":req.body.category,
        
      })
    }
   res.status(200).json("done")
  }
  catch(err){
    console.log("=========>"+err);
    res.send("err")
  }
   
})




server.put("/:id",async(req,res)=>{
  const user = db.collection('user');
  data =req.body
  try{
    await user.updateOne({"_id":new ObjectId(req.params.id)},{data})
  }
  catch(err){
    console.log("=========>"+err);
    res.send("err")
  }
   
})



server.put("/:id/img",upload.single("img"),async(req,res)=>{
  const user = db.collection('user');
 try{
  if (!req.file) {
    return res.status(403).json({ message: "you not send img" })
  }
  const pathimge = path.join(__dirname, "../upload/" + req.file.originalname)

   new_user = await user.findOne({ "_id": new ObjectId(req.params.id) })

  if (new_user.img.originalname == req.file.originalname) {
    fs.unlinkSync(pathimge)
     new_user = await user.findOne({ "_id": new ObjectId(req.user.id) })
    return res.status(200).json({ message: "upload img Succeed", new_user })
  }

 


  result = await cloud_uplod(pathimge)

  if (new_user.img.image_publicid !== null) {
    cloud_remove(new_user.img.image_publicid)

  }

  await user.updateOne({ "_id": new ObjectId(req.user.id) }, {
    $set: {
      "profile_image": {
        "url": result.secure_url,
        "image_publicid": result.public_id,
        "originalname": req.file.originalname,
      }
    }
  })

  const new_user = await user.findOne({ "_id": new ObjectId(req.user.id) })

  res.status(200).json({ message: "upload img Succeed",new_user })

  fs.unlinkSync(pathimge)

 }
 catch (err) {
  console.log("=========>" + err);
  res.status(500).send("err")
}
})
   



server.delete("/:id",async(req,res)=>{
  //input proudct.params._id
  const collection = db.collection('user');
  try{
  await collection.deleteOne({_id:new ObjectId(req.params.id)});
  res.send("done");
  }
  catch(err){
    console.log("=========>"+err);
    res.send("err")
  }
});


DBconnect ()

