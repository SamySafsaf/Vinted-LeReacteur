const mongoose = require("mongoose");
const User = require("../models/User");

const isAuthenticated = async (req, res, next) => {
    try {
        if (req.headers.authorization) {
            const token = req.headers.authorization.replace("Bearer ", "");

            const user = await User.findOne({ token: token }).select(
                "account email token"
            );
            if (user) {
                req.user = user;
                return next();
            } else {
                res.status(401).json({ message: "Unauthorized" });
            }
        } else {
            res.status(401).json({ message: "Unauthorized" });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = isAuthenticated;
