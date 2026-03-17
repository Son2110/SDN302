import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCircle, Trash2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/en";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications,
} from "../../services/notificationApi";

dayjs.extend(relativeTime);
dayjs.locale("en");

const NotificationDropdown = ({ isNavbar = true }) => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchNotifications = async () => {
    try {
      const response = await getNotifications();
      // The backend returns { success: true, data: notifications }
      const data = response?.data || response || [];
      const notificationsArray = Array.isArray(data) ? data : [];
      setNotifications(notificationsArray);
      setUnreadCount(notificationsArray.filter((n) => !n.is_read).length);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotifications();

    // Polling every 30 seconds
    const intervalId = setInterval(fetchNotifications, 30000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleMarkAsRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      fetchNotifications();
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      fetchNotifications();
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await deleteNotification(id);
      fetchNotifications();
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm("Are you sure you want to delete all notifications?")) return;
    try {
      await deleteAllNotifications();
      fetchNotifications();
    } catch (error) {
      console.error("Failed to delete all notifications:", error);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markNotificationAsRead(notification._id).then(() => fetchNotifications());
    }

    setIsOpen(false);
    
    const { related_model, related_id } = notification;
    let path = "/";

    if (user?.roles?.includes("staff")) {
      if (related_model === "Booking") path = `/staff/bookings/${related_id}`;
      else if (related_model === "ExtensionRequest") path = `/staff/extensions`;
      else if (related_model === "Payment") path = `/staff/payments`;
      else if (related_model === "DriverAssignment") path = `/staff/assignments`;
      else path = `/staff/bookings`;
    } else if (user?.roles?.includes("driver")) {
      if (related_model === "DriverAssignment") path = `/driver/assignments/${related_id}`;
      else path = `/driver/assignments`;
    } else {
      if (related_model === "Booking") path = `/bookings/${related_id}`;
      else if (related_model === "ExtensionRequest") path = `/extensions/${related_id}`;
      else if (related_model === "Payment") path = `/my-payments`;
      else path = `/my-bookings`;
    }

    navigate(path);
  };

  const formatDistanceToNow = (dateStr) => {
    return dayjs(dateStr).fromNow();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 transition-colors rounded-full flex items-center justify-center
          ${isNavbar ? "text-gray-300 hover:text-white hover:bg-white/10" : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"}
        `}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1.5 flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white border border-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-[400px] rounded-2xl bg-white shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right">
          <div className="flex items-center justify-between px-5 py-4 bg-gray-50/50 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900 text-base">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">
                  {unreadCount} NEW
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
                  title="Mark all as read"
                >
                  <CheckCheck size={14} />
                  Mark all as read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleDeleteAll}
                  className="text-xs font-bold text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors"
                  title="Delete all notifications"
                >
                  <Trash2 size={14} />
                  Delete all
                </button>
              )}
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="mx-auto h-8 w-8 mb-2 opacity-20" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {notifications.map((notification) => (
                  <li
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`group flex items-start gap-3 p-4 transition-colors cursor-pointer hover:bg-gray-50 ${
                      !notification.is_read ? "bg-blue-50/30" : "bg-white"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm ${
                          !notification.is_read
                            ? "font-semibold text-gray-900"
                            : "font-medium text-gray-800"
                        }`}
                      >
                        {notification.title}
                      </p>
                      <p
                        className={`text-xs mt-1 line-clamp-2 ${
                          !notification.is_read
                            ? "text-gray-700"
                            : "text-gray-500"
                        }`}
                      >
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                          {formatDistanceToNow(notification.createdAt)}
                        </span>
                        
                        {!notification.is_read && (
                           <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notification._id);
                            }}
                            className="text-[10px] font-bold text-blue-600 hover:underline uppercase tracking-wider"
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleDelete(e, notification._id)}
                      className="flex-shrink-0 text-gray-300 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                      title="Delete notification"
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          {/* <div className="bg-gray-50 border-t border-gray-100 py-3 px-5 text-center">
            <button 
              onClick={() => { setIsOpen(false); navigate(user?.roles?.includes('staff') ? '/staff/bookings' : '/my-bookings'); }}
              className="text-xs text-blue-600 font-bold hover:underline"
            >
              View all notifications 
            </button>
          </div> */}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
