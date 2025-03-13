// const mongoose = require("mongoose");

// const UserProfileSchema = new mongoose.Schema(
//   {
//     userid: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//       index: true,
//     },
//     clgemail:{type:String,unique:true},
//     backupemail: { type: String, unique: true },
//     name: { type: String, required: true },
//     username: { type: String, required: true, unique: true },
//     bio: { type: String, required: true },
//     tags: {
//       type: [{ type: String }],
//       validate: {
//         validator: function (tags) {
//           return tags.length <= 3;
//         },
//         message: "You can only have up to 3 tags.",
//       },
//     },
//     LinkedInUrl: { type: String, required: true, unique: true },
//     Githubusername: { type: String, required: true, unique: true },
//     noOfQuestions: { type: Number, default: 0 },
//     Graduation: { type: String },
//     noOfAnswers: { type: Number, default: 0 },
//     avgRating: {
//       type: Number,
//       default: 0,
//       min: [0, "Rating cannot be negative."],
//       max: [5, "Rating cannot be greater than 5."],
//     },

//     totalPoints: {
//       type: Number,
//       default: 0,
//       min: [0, "Total points cannot be negative."],
//     },
//     questionIds: [
//       { type: mongoose.Schema.Types.ObjectId, ref: "Question", default: [] },
//     ],
//     answerIds: [
//       { type: mongoose.Schema.Types.ObjectId, ref: "Answer", default: [] },
//     ],
//     achievements: [{ type: String, default: [] }],
//     followers: [
//       { type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] },
//     ],
//     following: [
//       { type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] },
//     ],
//     noOfFollowers: { type: Number, default: 0 },
//     noOfFollowing: { type: Number, default: 0 },
//     imageUrl: {
//       type: String,
//       default:
//         "https://ui-avatars.com/api/?name=User&background=random&color=fff",
//     },
//     likedQuetion:[
//       { type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] },
//     ],
//     likedAnswer:[
//       { type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] },
//     ],
//   },
//   { timestamps: true }
// );

// // Function to generate image initials
// function generateImageUrl(name) {
//   if (!name) return "";

//   const words = name.split(" ");
//   const initials =
//     words.length >= 2
//       ? words[0][0].toUpperCase() + words[1][0].toUpperCase()
//       : words[0][0].toUpperCase();

//   // Generate a random hex color
//   const randomColor = Math.floor(Math.random() * 16777215).toString(16);

//   return `https://ui-avatars.com/api/?name=${initials}&background=${randomColor}&color=fff`;
// }

// // Middleware to automatically update counts and generate image URL
// UserProfileSchema.pre("save", async function (next) {
//   this.noOfFollowers = this.followers.length;
//   this.noOfFollowing = this.following.length;
  

//   if (this.isNew || this.isModified("userid")) {
//     const user = await mongoose.model("User").findById(this.userid);
//     if (user && user.name) {
//       this.imageUrl = generateImageUrl(user.name);
//     }
//   }

//   next();
// });

// UserProfileSchema.post("save", async function (doc, next) {
//   try {
//     // Update the User schema's name when the profile is saved
//     await mongoose.model("User").findByIdAndUpdate(doc.userid, {
//       name: doc.name,
//     });

//     next();
//   } catch (err) {
//     next(err);
//   }
// });


// module.exports = mongoose.model("UserProfile", UserProfileSchema);
const mongoose = require("mongoose");

const UserProfileSchema = new mongoose.Schema(
  {
    userid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    clgemail: { type: String, unique: true },
    backupemail: { type: String, unique: true },
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    bio: { type: String, required: true },
    tags: {
      type: [{ type: String }],
      validate: {
        validator: function (tags) {
          return tags.length <= 3;
        },
        message: "You can only have up to 3 tags.",
      },
    },
    LinkedInUrl: { type: String, unique: true, sparse: true },
    Githubusername: { type: String, required: true, unique: true },
    noOfQuestions: { type: Number, default: 0 },
    Graduation: { type: String },
    noOfAnswers: { type: Number, default: 0 },
    avgRating: {
      type: Number,
      default: 0,
      min: [0, "Rating cannot be negative."],
      max: [5, "Rating cannot be greater than 5."],
    },
    totalPoints: {
      type: Number,
      default: 0,
      min: [0, "Total points cannot be negative."],
    },
    questionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question", default: [] }],
    answerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Answer", default: [] }],
    achievements: [{ type: String, default: [] }],
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] }],
    noOfFollowers: { type: Number, default: 0 },
    noOfFollowing: { type: Number, default: 0 },
    imageUrl: {
      type: String,
      default: "https://ui-avatars.com/api/?name=User&background=random&color=fff",
    },
    likedQuestion: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Question", default: [] }, // 🟢 Fixed the typo here
    ],
    likedAnswer: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Answer", default: [] },
    ],
  },
  { timestamps: true }
);

// Function to generate image initials
function generateImageUrl(name) {
  if (!name) return "";

  const words = name.split(" ");
  const initials =
    words.length >= 2
      ? words[0][0].toUpperCase() + words[1][0].toUpperCase()
      : words[0][0].toUpperCase();

  const randomColor = Math.floor(Math.random() * 16777215).toString(16);
  return `https://ui-avatars.com/api/?name=${initials}&background=${randomColor}&color=fff`;
}

// Middleware to automatically update counts
UserProfileSchema.pre("save", async function (next) {
  this.noOfFollowers = this.followers.length;
  this.noOfFollowing = this.following.length;

  if (this.isNew || this.isModified("userid")) {
    const user = await mongoose.model("User").findById(this.userid);
    if (user && user.name) {
      this.imageUrl = generateImageUrl(user.name);
    }
  }
  next();
});

module.exports = mongoose.model("UserProfile", UserProfileSchema);
