const router = require("express").Router();

const Event = require("../models/Event");
const Registration = require("../models/Registration");

const { protect, allow } = require("../middleware/auth");


// Add registration count + seats left
async function withCounts(events) {

  return Promise.all(
    events.map(async (e) => {

      const registeredCount =
        await Registration.countDocuments({
          event: e._id,
          status: "registered"
        });

      return {
        ...e.toObject(),
        registeredCount,
        seatsLeft: Math.max(
          e.capacity - registeredCount,
          0
        )
      };

    })
  );

}


// GET ALL PUBLISHED EVENTS
router.get("/", async (req, res, next) => {

  try {

    const {
      search,
      category,
      type
    } = req.query;

    const f = {
      status: "published"
    };


    if (search) {

      f.$or = [
        {
          title: {
            $regex: search,
            $options: "i"
          }
        },
        {
          description: {
            $regex: search,
            $options: "i"
          }
        },
        {
          location: {
            $regex: search,
            $options: "i"
          }
        }
      ];

    }


    if (
      category &&
      category !== "All"
    ) {
      f.category = category;
    }


    if (
      type &&
      type !== "All"
    ) {
      f.type = type;
    }


    const events =
      await Event.find(f)
        .populate(
          "organizer",
          "name email"
        )
        .sort({ date: 1 });


    res.json({
      success: true,
      events: await withCounts(events)
    });

  } catch (e) {

    next(e);

  }

});


// GET ORGANIZER'S OWN EVENTS
// Dashboard uses this endpoint
router.get(
  "/organizer/my",
  protect,
  allow("organizer"),
  async (req, res, next) => {

    try {

      const events =
        await Event.find({
          organizer: req.user._id
        })
        .populate(
          "organizer",
          "name email"
        )
        .sort({ date: 1 });


      res.json({
        success: true,
        events: await withCounts(events)
      });

    } catch (e) {

      next(e);

    }

  }
);


// GET MY EVENTS
// Kept for compatibility
router.get(
  "/mine",
  protect,
  allow("organizer", "admin"),
  async (req, res, next) => {

    try {

      const f =
        req.user.role === "admin"
          ? {}
          : {
              organizer: req.user._id
            };


      res.json({
        success: true,
        events: await withCounts(
          await Event.find(f)
            .populate(
              "organizer",
              "name email"
            )
            .sort({ date: 1 })
        )
      });

    } catch (e) {

      next(e);

    }

  }
);


// GET SINGLE EVENT
router.get(
  "/:id",
  async (req, res, next) => {

    try {

      const e =
        await Event.findById(
          req.params.id
        ).populate(
          "organizer",
          "name email"
        );


      if (!e) {

        return res.status(404).json({
          success: false,
          message: "Event not found"
        });

      }


      res.json({
        success: true,
        event: (
          await withCounts([e])
        )[0]
      });

    } catch (e) {

      next(e);

    }

  }
);


// CREATE EVENT
router.post(
  "/",
  protect,
  allow("organizer", "admin"),
  async (req, res, next) => {

    try {

      const {
        title,
        description,
        category,
        type,
        date,
        time,
        location,
        capacity
      } = req.body;


      if (
        !title ||
        !description ||
        !category ||
        !date ||
        !time ||
        !location ||
        !capacity
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Please fill all required fields"
        });

      }


      const e =
        await Event.create({

          title,
          description,
          category,
          type,
          date,
          time,
          location,

          capacity:
            Number(capacity),

          organizer:
            req.user._id

        });


      res.status(201).json({
        success: true,
        event: e
      });

    } catch (e) {

      next(e);

    }

  }
);


// UPDATE EVENT
router.put(
  "/:id",
  protect,
  allow("organizer", "admin"),
  async (req, res, next) => {

    try {

      const e =
        await Event.findById(
          req.params.id
        );


      if (!e) {

        return res.status(404).json({
          success: false,
          message: "Event not found"
        });

      }


      if (
        req.user.role !== "admin" &&
        e.organizer.toString() !==
          req.user._id.toString()
      ) {

        return res.status(403).json({
          success: false,
          message: "Not your event"
        });

      }


      [
        "title",
        "description",
        "category",
        "type",
        "date",
        "time",
        "location",
        "capacity",
        "status"
      ].forEach((k) => {

        if (
          req.body[k] !== undefined
        ) {

          e[k] = req.body[k];

        }

      });


      await e.save();


      res.json({
        success: true,
        event: e
      });

    } catch (e) {

      next(e);

    }

  }
);


// DELETE EVENT
router.delete(
  "/:id",
  protect,
  allow("organizer", "admin"),
  async (req, res, next) => {

    try {

      const e =
        await Event.findById(
          req.params.id
        );


      if (!e) {

        return res.status(404).json({
          success: false,
          message: "Event not found"
        });

      }


      if (
        req.user.role !== "admin" &&
        e.organizer.toString() !==
          req.user._id.toString()
      ) {

        return res.status(403).json({
          success: false,
          message: "Not your event"
        });

      }


      await Registration.deleteMany({
        event: e._id
      });


      await e.deleteOne();


      res.json({
        success: true,
        message: "Event deleted"
      });

    } catch (e) {

      next(e);

    }

  }
);


module.exports = router;