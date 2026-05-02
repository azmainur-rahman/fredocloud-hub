import cloudinary from "../utils/cloudinary.js";
import prisma from "../utils/prisma.js";

const publicUserSelect = {
  id: true,
  email: true,
  name: true,
  avatarUrl: true,
  createdAt: true,
  updatedAt: true,
};

const uploadToCloudinary = (fileBuffer) =>{
 return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "fredocloud/avatars",
        resource_type: "image",
        transformation: [
          { width: 400, height: 400, crop: "fill", gravity: "face" },
          { quality: "auto", fetch_format: "auto" },
        ],
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      },
    );

    stream.end(fileBuffer);
  });
}
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Avatar image is required." });
    }

    if (!req.file.mimetype.startsWith("image/")) {
      return res
        .status(400)
        .json({ message: "Only image uploads are allowed." });
    }

    const result = await uploadToCloudinary(req.file.buffer);
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatarUrl: result.secure_url },
      select: publicUserSelect,
    });

    return res.json({ user });
  } catch {
    return res.status(500).json({
      message: "Failed to upload avatar. Check Cloudinary configuration.",
    });
  }
};

export const uploadAttachment = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const entityType = req.body.entityType?.trim();
    const entityId = req.body.entityId?.trim();

    if (!req.file) {
      return res.status(400).json({ message: "Attachment file is required." });
    }

    if (!entityType || !entityId) {
      return res
        .status(400)
        .json({ message: "Entity type and entity ID are required." });
    }

    const membership = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: req.user.id,
          workspaceId,
        },
      },
    });

    if (!membership || membership.role !== "ADMIN") {
      return res.status(403).json({ message: "Admin access required." });
    }

    if (entityType !== "ANNOUNCEMENT") {
      return res.status(400).json({ message: "Unsupported attachment type." });
    }

    const announcement = await prisma.announcement.findFirst({
      where: {
        id: entityId,
        workspaceId,
      },
      select: { id: true },
    });

    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found." });
    }

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "fredocloud/attachments",
          resource_type: "auto",
        },
        (error, uploadResult) => {
          if (error) {
            reject(error);
            return;
          }

          resolve(uploadResult);
        },
      );

      stream.end(req.file.buffer);
    });

    const attachment = await prisma.attachment.create({
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        entityType,
        entityId,
        uploaderId: req.user.id,
        workspaceId,
      },
    });

    return res.status(201).json({ attachment });
  } catch {
    return res.status(500).json({
      message: "Failed to upload attachment. Check Cloudinary configuration.",
    });
  }
};
