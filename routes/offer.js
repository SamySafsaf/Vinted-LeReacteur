const express = require("express");
const router = express.Router();
const cloudinary = require("cloudinary").v2;

const User = require("../models/User");
const Offer = require("../models/Offer");
const isAuthenticated = require("../middleware/isAuthenticated");

router.post("/offers/publish", isAuthenticated, async (req, res) => {
    try {
        if (req.fields.price <= 100000) {
            if (req.fields.description.length <= 500) {
                if (req.fields.title.length <= 50) {
                    const newOffer = await new Offer({
                        product_name: req.fields.title,
                        product_description: req.fields.description,
                        product_price: req.fields.price,
                        product_details: [
                            { MARQUE: req.fields.brand },
                            { TAILLE: req.fields.size },
                            { ÉTAT: req.fields.condition },
                            { COULEUR: req.fields.color },
                            { EMPLACEMENT: req.fields.city },
                        ],

                        owner: req.user,
                    });

                    const pictureTU = req.files.picture.path;
                    const result = await cloudinary.uploader.upload(pictureTU, {
                        folder: `/vinted/offers/${newOffer._id}`,
                    });
                    newOffer.product_image = result;
                    await newOffer.save();

                    res.status(200).json(newOffer);
                } else {
                    res.status(400).json({
                        message: "Title must be 50 characters at maximum",
                    });
                }
            } else {
                res.status(400).json({
                    message: "Description must be 500 characters at maximum",
                });
            }
        } else {
            res.status(400).json({
                message: "Price must be 100 000 at maximum",
            });
        }
    } catch (error) {}
    res.status(401).json({ error: error.message });
});

router.put("/offers/update/:id", isAuthenticated, async (req, res) => {
    try {
        const offerToUpdate = await Offer.findById({ _id: req.params.id });

        if (req.fields.title) {
            offerToUpdate.product_name = req.fields.title;
        }
        if (req.fields.description) {
            offerToUpdate.product_description = req.fields.description;
        }
        if (req.fields.price) {
            offerToUpdate.product_price = req.fields.price;
        }
        const details = offerToModify.product_details;
        for (i = 0; i < details.length; i++) {
            if (details[i].MARQUE) {
                if (req.fields.brand) {
                    details[i].MARQUE = req.fields.brand;
                }
            }
            if (details[i].TAILLE) {
                if (req.fields.size) {
                    details[i].TAILLE = req.fields.size;
                }
            }
            if (details[i].ÉTAT) {
                if (req.fields.condition) {
                    details[i].ÉTAT = req.fields.condition;
                }
            }
            if (details[i].COULEUR) {
                if (req.fields.color) {
                    details[i].COULEUR = req.fields.color;
                }
            }
            if (details[i].EMPLACEMENT) {
                if (req.fields.location) {
                    details[i].EMPLACEMENT = req.fields.location;
                }
            }
        }

        // Notifie Mongoose que l'on a modifié le tableau product_details
        offerToUpdate.markModified("product_details");

        if (req.files.picture) {
            const pictureToChange = req.files.picture.path;
            const result = await cloudinary.uploader.upload(pictureToChange, {
                folder: `/vinted/offers/${offerToUpdate._id}`,
            });
            offerToUpdate.product_image = { secure_url: result.secure_url };
        }

        // (offerToUpdate.product_name = req.fields.title),
        //     (offerToUpdate.product_description = req.fields.description),
        //     (offerToUpdate.product_price = req.fields.price),
        //     (offerToUpdate.product_details = [
        //         { MARQUE: req.fields.brand },
        //         { TAILLE: req.fields.size },
        //         { ÉTAT: req.fields.condition },
        //         { COULEUR: req.fields.color },
        //         { EMPLACEMENT: req.fields.city },
        //     ]),
        //     (offerToUpdate.product_image = { secure_url: result.secure_url });

        await offerToUpdate.save();
        await offerToUpdate.populate("owner", "account").execPopulate();
        res.status(200).json(offerToUpdate);
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
});

router.delete("/offers/delete/:id", isAuthenticated, async (req, res) => {
    try {
        const offerToDelete = await Offer.findByIdAndDelete(req.params.id);
        if (offerToDelete) {
            await cloudinary.api.delete_ressources_by_prefix(
                `/vinted/offers/${offerToUpdate._id}`
            );
            await cloudinary.api.delete_folder(
                `/vinted/offers/${offerToUpdate._id}`
            );
            res.status(200).json({ message: "Offer deleted" });
        } else {
            res.status(400).json({ message: "Wrong Id" });
        }
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
});

router.get("/offers", async (req, res) => {
    try {
        const offers = await Offer.find({
            product_name: new RegExp(req.query.title, "i"),
            product_price: {
                $gte: req.query.priceMin || 0,
                $lte: req.query.priceMax || 100000,
            },
        })
            .sort(
                req.query.sort
                    ? { product_price: `${req.query.sort}` }
                    : { product_price: "asc" }
            )
            .skip(Number(req.query.show) * (Number(req.query.page) - 1) || 0)
            .limit(Number(req.query.show) || 100)
            .populate("owner", ["account", "token"])
            .select("product_name product_price");
        res.status(200).json(offers);
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
});

router.get("/offer/:id", async (req, res) => {
    try {
        const offer = await Offer.findById(req.params.id).populate("owner", [
            "account",
            "token",
        ]);
        res.status(200).json(offer);
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
});
module.exports = router;
