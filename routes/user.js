const express = require("express");
const router = express.Router();
const cloudinary = require("cloudinary").v2;

const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");

const User = require("../models/User");
const Offer = require("../models/Offer");


router.post("/user/signup", async (req, res) => {
    try {
        const password = req.fields.password;

        const userExist = await User.findOne({ email: req.fields.email });
        if (!userExist) {
            if (req.fields.username && req.fields.phone) {
                const salt = uid2(64);
                const hash = SHA256(password + salt).toString(encBase64);
                const token = uid2(64);

                const pictureToUpload = req.files.picture.path;
                const avatarPicture = await cloudinary.uploader.upload(
                    pictureToUpload,
                    {
                        folder: "/vinted/userAvatar",
                    }
                );
                const newUser = new User({
                    email: req.fields.email,
                    account: {
                        username: req.fields.username,
                        phone: req.fields.phone,
                        avatar: { secure_url: avatarPicture.secure_url },
                    },
                    salt: salt,
                    hash: hash,
                    token: token,
                });

                await newUser.save();

                res.status(200).json({
                    _id: newUser._id,
                    token: newUser.token,
                    account: {
                        username: newUser.account.username,
                        phone: newUser.account.phone,
                        avatar: avatarPicture.secure_url,
                    },
                });
            } else {
                res.status(400).json({
                    message: "Please make sure to inquire your username",
                });
            }
        } else {
            res.status(400).json({ message: "This email already exists" });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.post("/user/login", async (req, res) => {
    try {
        const user = await User.findOne({ email: req.fields.email });
        const password = req.fields.password;

        if (user) {
            const newHash = SHA256(password + user.salt).toString(encBase64);
            if (newHash === user.hash) {
                res.status(200).json({
                    _id: user._id,
                    token: user.token,
                    account: {
                        username: user.account.username,
                        phone: user.account.phone,
                    },
                });
            } else {
                res.status(403).json({
                    message: "Invalid password",
                });
            }
        } else {
            res.status(403).json({
                message: "This email or password is invalid",
            });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
