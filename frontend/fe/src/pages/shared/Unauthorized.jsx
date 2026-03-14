const Unauthorized = () => {
    return (
        <div className="flex h-screen items-center justify-center">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-red-600 mb-4">403 - Unauthorized</h1>
                <p className="text-gray-600 mb-4">You do not have permission to view this page.</p>
            </div>
        </div>
    );
};
export default Unauthorized;
