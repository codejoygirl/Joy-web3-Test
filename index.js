const express = require("express")
const app = express()
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const cookieParser  = require("cookie-parser")
const mongoose = require("mongoose")

const port = process.env.PORT || 5000
const jwtsercret = "mysecretproject"

const url = "mongodb://127.0.0.1:27017/vent"
const live = 'mongodb+srv://netninja:1020304050@cluster0.54vyixp.mongodb.net/vent?retryWrites=true&w=majority'



app.use(express.json({limit:"10mb"}))
app.use(express.urlencoded({extended:true}))
app.use(cookieParser())
app.set("view engine", "ejs")




mongoose.connect(live,{useUnifiedTopology:true,useNewUrlParser:true})
    .then(() => {
    console.log("Connected To DataBase")
    })
    .catch(() => {
    console.log("Could Not connect To database")
})


const userSchema = new mongoose.Schema({

    email: {
        type: String,
        required:true
    },
    password: {
        type: String,
        required:true
    },
    token: {
        type: String
    },
}, {timestamps:true})

const User = mongoose.model("user", userSchema)



app.post("/signup", async (request, response) => {
    
    const {email, password} = request.body

    console.log(request.body)
    

    try {
        
        if (!email) {
        
        return response.status(422).json({status:false, message:"Email is Missing"})

        }

        if(!password){

       return response.status(422).json({status:false, message:"Password is Missing"})
        }


        const userExists = await User.findOne({ email:email })
        
        if(userExists){

       return response.status(401).json({status:false, message:"Email Already in Use"})

        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await User.create({ email:email, password: hashedPassword })

        const token = jwt.sign({user}, jwtsercret)

        user.token = token

        await user.save()
        
        response.cookie("token",token,{httpOnly:true})

        response.status(201).json({status:true, message:"User Sucessfully Created"})




    }catch(error){

        response.status(500).json({status:false, message:"Internal Server Error"})
        console.log(error)
    }


})


app.post("/login", async (request, response) => {

    const {email, password} = request.body
    
    
     try {
        
        if (!email) {
        
        return response.status(422).json({status:false, message:"Email is Missing"})

        }

        if(!password){

       return response.status(422).json({status:false, message:"Password is Missing"})
        }


        const userExists = await User.findOne({ email })
        
        if(!userExists){

       return response.status(401).json({status:false, message:"Invalid Credentials"})

        }

         const passwordIsValid = bcrypt.compare(password, userExists.password)

         if (!passwordIsValid) {
             
       return response.status(401).json({status:false, message:"Invalid Credentials"})
             

         }
            
        response.cookie("token",userExists.token,{httpOnly:true})

        response.status(201).json({status:true, message:"Login Sucessful"})




    }catch(error){

        response.status(500).json({status:false, message:"Internal Server Error"})
        console.log(error)
    }

})


const checkLogin = async (request, response, next)=>{


    const token = request.cookies.token

    if(!token){

       return response.redirect("/login")

    }

    next()

}


app.get("/dashboard",checkLogin, (request, response) => {
    

    response.render("dashboard")
})

app.post("/logout", async  (request, response)=>{

    response.clearCookie("token")

    response.redirect("/login")

})


app.get("/login", (request, response)=>{

    response.render("login")

})
app.get("/signup", (request, response)=>{

    response.render("signup")

})



app.listen(port, () => {
    
    console.log("Server Started")

})