const User = require("../models/user.model");
const CollectionAgent = require("../models/collectionAgent.model");
const mongoose = require("mongoose");
const fs = require('fs').promises; // For deleting agent certificates
const path = require('path');

const handleError = (res, error, message = "An internal server error occurred", statusCode = 500) => {
  console.error(`${message}:`, error);
  const responseMessage = process.env.NODE_ENV === 'production' && statusCode === 500
    ? "An internal server error occurred."
    : error.message || message;
  res.status(statusCode).json({ message: responseMessage });
};

const getManagementOverviewStats = async (req, res) => {
  try {
    const [totalUsers, totalAgents, suspendedUsers, suspendedAgents] = await Promise.all([
      User.countDocuments({}),
      CollectionAgent.countDocuments({}),
      User.countDocuments({ status: "suspended" }),
      CollectionAgent.countDocuments({ status: "suspended" }),
    ]);

    res.status(200).json({
      totalUsers,
      totalAgents,
      suspendedUsers,
      suspendedAgents,
    });
  } catch (error) {
    handleError(res, error, "Failed to fetch admin management overview stats.");
  }
};

const getMonthlyUserGrowth = async (req, res) => {
  try {
    const monthlySignups = await User.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          year: "$_id.year",
          month: "$_id.month",
          count: "$count",
        },
      },
      {
        $sort: { year: 1, month: 1 },
      },
    ]);

    res.status(200).json(monthlySignups);
  } catch (error) {
    handleError(res, error, "Failed to fetch monthly user growth.");
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select("-password -__v") // Exclude sensitive fields
      .sort({ createdAt: -1 })
      .lean(); // Use lean for plain JS objects

    res.status(200).json(users);
  } catch (error) {
    handleError(res, error, "Failed to fetch all users.");
  }
};

const getAllAgents = async (req, res) => {
  try {
    const agents = await CollectionAgent.find({})
      .select("-password -certificatePath -__v") // Exclude sensitive fields
      .sort({ createdAt: -1 })
      .lean(); // Use lean for plain JS objects

    res.status(200).json(agents);
  } catch (error) {
    handleError(res, error, "Failed to fetch all collection agents.");
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return handleError(res, new Error("Invalid user ID format."), null, 400);
    }

    // Validate the requested status against the enum
    const validStatuses = ['active', 'suspended'];
    if (!status || !validStatuses.includes(status)) {
        return handleError(res, new Error(`Invalid status value. Must be one of: ${validStatuses.join(', ')}.`), null, 400);
    }


    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { status: status },
      { new: true, runValidators: true } // runValidators ensures the status is valid
    ).select("-password -__v"); // Exclude sensitive fields from response

    if (!updatedUser) {
      return handleError(res, new Error("User not found."), null, 404);
    }

    res.status(200).json({
      message: `User status updated to '${updatedUser.status}'.`,
      user: updatedUser,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
         return handleError(res, error, "Status validation failed.", 400);
    }
    handleError(res, error, "Failed to update user status.");
  }
};

const updateAgentStatus = async (req, res) => {
  try {
    const { agentId } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(agentId)) {
      return handleError(res, new Error("Invalid agent ID format."), null, 400);
    }

     const validStatuses = ['active', 'suspended'];
     if (!status || !validStatuses.includes(status)) {
         return handleError(res, new Error(`Invalid status value. Must be one of: ${validStatuses.join(', ')}.`), null, 400);
     }


    const updatedAgent = await CollectionAgent.findByIdAndUpdate(
      agentId,
      { status: status },
      { new: true, runValidators: true } // runValidators ensures the status is valid
    ).select("-password -certificatePath -__v"); // Exclude sensitive fields from response

    if (!updatedAgent) {
      return handleError(res, new Error("Collection agent not found."), null, 404);
    }

    res.status(200).json({
      message: `Collection agent status updated to '${updatedAgent.status}'.`,
      agent: updatedAgent,
    });
  } catch (error) {
     if (error.name === 'ValidationError') {
         return handleError(res, error, "Status validation failed.", 400);
     }
    handleError(res, error, "Failed to update collection agent status.");
  }
};

const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return handleError(res, new Error("Invalid user ID format."), null, 400);
    }

    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return handleError(res, new Error("User not found."), null, 404);
    }

    res.status(200).json({
      message: "User deleted successfully.",
      user: {
        id: deletedUser._id,
        email: deletedUser.email,
        name: deletedUser.name
        // Return minimal info
      },
    });
  } catch (error) {
    handleError(res, error, "Failed to delete user.");
  }
};

const deleteAgent = async (req, res) => {
  try {
    const { agentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(agentId)) {
      return handleError(res, new Error("Invalid agent ID format."), null, 400);
    }

    const agentToDelete = await CollectionAgent.findById(agentId);

    if (!agentToDelete) {
        return handleError(res, new Error("Collection agent not found."), null, 404);
    }

    // --- Optional: Delete the associated certificate file ---
    if (agentToDelete.certificatePath) {
        const filePath = path.join(__dirname, '..', '..', agentToDelete.certificatePath); // Adjust path if necessary
        try {
            await fs.unlink(filePath);
            console.log(`Deleted agent certificate file: ${filePath}`);
        } catch (fileError) {
            console.warn(`Could not delete agent certificate file ${filePath}:`, fileError.message);
            // Don't fail the request just because the file couldn't be deleted
        }
    }
     // --- End Optional File Deletion ---


    const deletedAgent = await CollectionAgent.findByIdAndDelete(agentId);

    // Note: findByIdAndDelete will also return the document before deletion,
    // so the previous findById check is primarily for handling the file deletion *before* deleting the DB record.
    // If file deletion is not critical for success, the findByIdAndDelete alone with a null check is sufficient.
    // Keeping both here as a safety for file cleanup.


    res.status(200).json({
      message: "Collection agent deleted successfully.",
      agent: {
        id: deletedAgent._id,
        email: deletedAgent.email,
        name: deletedAgent.name
         // Return minimal info
      },
    });
  } catch (error) {
    handleError(res, error, "Failed to delete collection agent.");
  }
};


module.exports = {
  getManagementOverviewStats,
  getMonthlyUserGrowth,
  getAllUsers,
  getAllAgents,
  updateUserStatus,
  updateAgentStatus,
  deleteUser,
  deleteAgent,
};
