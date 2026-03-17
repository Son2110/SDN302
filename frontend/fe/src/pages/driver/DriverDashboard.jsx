import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Car,
  Star,
  Clock,
  ClipboardList,
  Award,
  ArrowRight,
  TrendingUp,
  User,
  Power,
  Eye,
  LayoutDashboard,
} from "lucide-react";
import { getMyAssignments } from "../../services/driverAssignmentApi";
import { getMyProfile } from "../../services/api";
import dayjs from "dayjs";

const DriverDashboard = () => {
  const [stats, setStats] = useState({
    totalTrips: 0,
    rating: 0,
    pendingAssignments: 0,
    experience: 0,
    status: "offline",
  });
  const [recentAssignments, setRecentAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [profileRes, assignmentsRes] = await Promise.all([
        getMyProfile(),
        getMyAssignments("pending"),
      ]);

      const driver = profileRes?.data?.driver || {};
      const pending = assignmentsRes?.data || [];

      setStats({
        totalTrips: driver.total_trips || 0,
        rating: driver.rating || 0,
        pendingAssignments: pending.length,
        experience: driver.experience_years || 0,
        status: driver.status || "offline",
      });

      setRecentAssignments(pending.slice(0, 3));
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const quickLinks = [
    {
      label: "New Assignments",
      to: "/driver/assignments",
      icon: ClipboardList,
      color: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100",
    },
    {
      label: "Reviews",
      to: "/driver/reviews",
      icon: Star,
      color: "bg-yellow-50 text-yellow-600 hover:bg-yellow-100",
    },
    {
      label: "My Profile",
      to: "/profile",
      icon: User,
      color: "bg-blue-50 text-blue-600 hover:bg-blue-100",
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-inter">
      {/* Header with Glass Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-white p-6 border border-gray-100 shadow-sm group">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-40 group-hover:bg-emerald-100 transition-colors duration-500" />
        <div className="relative flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-100 ring-4 ring-emerald-50">
            <LayoutDashboard className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Dashboard Overview
            </h1>
            <p className="text-gray-400 text-xs font-medium mt-0.5">
              Good morning, driver! Let's check your schedule for today.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
        </div>
      ) : (
        <>
          {/* Stats Cards - Elegant slim cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Trips", value: stats.totalTrips, icon: Car, color: "emerald", sub: "Trips" },
              { label: "Rating", value: stats.rating.toFixed(1), icon: Star, color: "yellow", sub: "/ 5.0" },
              { label: "Pending Requests", value: stats.pendingAssignments, icon: Clock, color: "orange", sub: "Requests" },
              { 
                label: "Status", 
                value: stats.status === 'available' ? 'On Duty' : stats.status === 'busy' ? 'Busy' : 'Off Duty', 
                icon: Power, 
                color: stats.status === 'available' ? 'emerald' : stats.status === 'busy' ? 'amber' : 'gray', 
                sub: "Current",
                isStatus: true
              }
            ].map((card, idx) => (
              <div 
                key={idx}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:-translate-y-1 hover:shadow-md transition-all duration-300 group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    {card.label}
                  </span>
                  <div className={`p-2 bg-${card.color}-50 rounded-xl`}>
                    <card.icon className={`w-4 h-4 text-${card.color === 'emerald' ? 'emerald-600' : card.color === 'yellow' ? 'yellow-600' : card.color === 'orange' ? 'orange-600' : card.color === 'amber' ? 'amber-600' : 'text-gray-400'}`} />
                  </div>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className={`text-2xl font-bold tracking-tight ${card.color === 'emerald' ? 'text-emerald-600' : card.color === 'orange' ? 'text-orange-600' : card.color === 'amber' ? 'text-amber-600' : 'text-gray-900'}`}>
                    {card.value}
                  </span>
                  {!card.isStatus && <span className="text-[9px] font-medium text-gray-400 uppercase">{card.sub}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-500" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: "New Assignments", to: "/driver/assignments", icon: ClipboardList, gradient: "from-emerald-500 to-teal-600" },
                { label: "Reviews", to: "/driver/reviews", icon: Star, gradient: "from-yellow-400 to-orange-500" },
                { label: "My Profile", to: "/profile", icon: User, gradient: "from-blue-500 to-indigo-600" }
              ].map((link, idx) => (
                <Link
                  key={idx}
                  to={link.to}
                  className="relative overflow-hidden p-5 rounded-2xl group/link transition-all duration-300 hover:scale-[1.01]"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${link.gradient} opacity-90 group-hover/link:opacity-100 transition-opacity`} />
                  <div className="relative flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white ring-1 ring-white/30">
                      <link.icon size={20} />
                    </div>
                    <span className="text-base font-semibold text-white tracking-tight">{link.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Assignments */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <div className="w-1 h-5 bg-emerald-500 rounded-full" />
                Latest Assignments
              </h2>
              <Link
                to="/driver/assignments"
                className="text-emerald-600 text-xs font-semibold hover:underline flex items-center gap-1"
              >
                View All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {recentAssignments.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center">
                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-3">
                  <ClipboardList className="w-7 h-7 text-gray-200" />
                </div>
                <p className="text-gray-400 font-semibold text-base">No pending assignments</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {recentAssignments.map((asn) => (
                  <div
                    key={asn._id}
                    className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-all duration-200 group/list"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                        <Car size={22} />
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 text-sm">
                          {asn.booking?.vehicle?.brand} {asn.booking?.vehicle?.model}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                           <div className="flex items-center gap-1 text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                             <Clock size={10} className="text-emerald-500" />
                             {dayjs(asn.booking?.start_date).format("DD/MM/YYYY")}
                           </div>
                           <span className="text-gray-200 text-[9px]">•</span>
                           <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                             Awaiting Confirmation
                           </span>
                        </div>
                      </div>
                    </div>
                    <Link 
                      to={`/driver/assignments/${asn._id}`}
                      className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-emerald-600 transition-colors"
                     >
                        <ArrowRight size={20} />
                     </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DriverDashboard;
