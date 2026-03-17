import { Booking } from "../models/booking.model.js";
import { sendNotification } from "./notificationSender.js";

const MS_30_MINUTES = 30 * 60 * 1000;
const MS_2_HOURS = 2 * 60 * 60 * 1000;

const safeShortId = (id) => id?.toString()?.slice(-6) || "------";

const notifyAndCancelOverduePendingPayments = async (now) => {
    const overduePendingBookings = await Booking.find({
        status: "pending",
        createdAt: { $lte: new Date(now.getTime() - MS_30_MINUTES) },
    }).populate({ path: "customer", select: "user" });

    for (const booking of overduePendingBookings) {
        try {
            booking.updateStatus("cancelled");
            await booking.save();

            if (booking.customer?.user) {
                await sendNotification({
                    recipientId: booking.customer.user,
                    title: "Quá hạn thanh toán cọc",
                    message: `Đơn #${safeShortId(booking._id)} đã bị hủy vì quá 30 phút chưa thanh toán cọc.`,
                    type: "payment_overdue",
                    relatedId: booking._id,
                    relatedModel: "Booking",
                    eventKey: `booking:${booking._id}:payment-overdue`,
                });
            }
        } catch (error) {
            console.error("[bookingNotificationJob] Failed to cancel overdue pending booking:", error.message);
        }
    }
};

const notifyPickupDay = async (now) => {
    const pickupCandidates = await Booking.find({
        status: { $in: ["confirmed", "vehicle_delivered"] },
        start_date: { $lte: now },
    })
        .populate({ path: "customer", select: "user" })
        .populate({ path: "vehicle", select: "brand model license_plate" });

    for (const booking of pickupCandidates) {
        if (!booking.customer?.user) continue;

        await sendNotification({
            recipientId: booking.customer.user,
            title: "Đến ngày nhận xe",
            message: `Hôm nay là ngày nhận xe ${booking.vehicle?.license_plate || ""} cho đơn #${safeShortId(booking._id)}.`,
            type: "pickup_reminder",
            relatedId: booking._id,
            relatedModel: "Booking",
            eventKey: `booking:${booking._id}:pickup-day`,
        });
    }
};

const notifyReturnSoon = async (now) => {
    const threshold = new Date(now.getTime() + MS_2_HOURS);

    const returnSoonCandidates = await Booking.find({
        status: { $in: ["confirmed", "vehicle_delivered", "in_progress"] },
        end_date: { $gt: now, $lte: threshold },
    })
        .populate({ path: "customer", select: "user" })
        .populate({ path: "vehicle", select: "brand model license_plate" });

    for (const booking of returnSoonCandidates) {
        if (!booking.customer?.user) continue;

        await sendNotification({
            recipientId: booking.customer.user,
            title: "Sắp đến hạn trả xe",
            message: `Đơn #${safeShortId(booking._id)} sẽ đến hạn trả xe trong vòng 2 tiếng nữa.`,
            type: "return_reminder",
            relatedId: booking._id,
            relatedModel: "Booking",
            eventKey: `booking:${booking._id}:return-soon`,
        });
    }
};

const notifyReturnOverdue = async (now) => {
    const overdueReturnCandidates = await Booking.find({
        status: { $in: ["confirmed", "vehicle_delivered", "in_progress"] },
        end_date: { $lt: now },
    })
        .populate({ path: "customer", select: "user" })
        .populate({ path: "vehicle", select: "brand model license_plate" });

    for (const booking of overdueReturnCandidates) {
        if (!booking.customer?.user) continue;

        await sendNotification({
            recipientId: booking.customer.user,
            title: "Quá hạn trả xe",
            message: `Đơn #${safeShortId(booking._id)} đã quá hạn trả xe. Vui lòng liên hệ ngay với nhân viên hỗ trợ.`,
            type: "return_overdue",
            relatedId: booking._id,
            relatedModel: "Booking",
            eventKey: `booking:${booking._id}:return-overdue`,
        });
    }
};

export const runBookingNotificationCycle = async () => {
    const now = new Date();
    await notifyAndCancelOverduePendingPayments(now);
    await notifyPickupDay(now);
    await notifyReturnSoon(now);
    await notifyReturnOverdue(now);
};

export const startBookingNotificationJob = () => {
    runBookingNotificationCycle().catch((error) => {
        console.error("[bookingNotificationJob] Initial run failed:", error.message);
    });

    setInterval(() => {
        runBookingNotificationCycle().catch((error) => {
            console.error("[bookingNotificationJob] Scheduled run failed:", error.message);
        });
    }, 60 * 1000);
};
