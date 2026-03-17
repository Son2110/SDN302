import { useAuth } from "../../context/AuthContext";
import { User, Mail, Shield } from "lucide-react";

const Profile = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4 sm:px-6">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header/Cover */}
        <div className="h-32 bg-gradient-to-r from-blue-600 to-blue-400"></div>
        
        {/* Avatar */}
        <div className="px-6 flex justify-center -mt-16 mb-4">
          <div className="w-32 h-32 bg-white rounded-full p-2 shadow-md">
            <div className="w-full h-full bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
               <User size={48} />
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="px-6 pb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{user.full_name || "User"}</h1>
          <p className="text-gray-500 font-medium text-sm mb-6 flex items-center justify-center gap-1">
             <Mail size={14} /> {user.email}
          </p>

          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {user.roles && user.roles.map(role => (
              <span key={role} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 text-xs font-bold uppercase rounded-full tracking-wider border border-gray-200">
                <Shield size={12} /> {role}
              </span>
            ))}
          </div>

          <div className="border-t border-gray-100 pt-6">
            <button 
              onClick={logout}
              className="w-full py-3 bg-red-50 text-red-600 font-bold rounded-xl border border-red-100 hover:bg-red-100 transition-colors"
            >
              LOGOUT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
