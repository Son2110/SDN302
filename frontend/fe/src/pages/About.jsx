import { Car, Users, Award, Shield, Zap, Leaf } from "lucide-react";

const About = () => {
    const features = [
        {
            icon: Car,
            title: "Modern fleet",
            description: "100% high-end electric vehicles, periodically maintained and guaranteed the best quality"
        },
        {
            icon: Users,
            title: "Professional team",
            description: "Driver is experienced, enthusiastic and always ready to serve customers 24/7"
        },
        {
            icon: Award,
            title: "Trusted service",
            description: "More than 5 years of experience in the field of electric car rental in Ho Chi Minh City"
        },
        {
            icon: Shield,
            title: "Comprehensive insurance",
            description: "All vehicles are fully insured, ensuring peace of mind for your journey"
        },
        {
            icon: Zap,
            title: "Quick booking",
            description: "Convenient online booking system, confirmation in just a few minutes"
        },
        {
            icon: Leaf,
            title: "Eco-friendly",
            description: "100% electric vehicles, contributing to reducing pollution and protecting the green environment"
        }
    ];

    const stats = [
        { label: "Customers are satisfied", value: "10,000+" },
        { label: "Premium electric vehicles", value: "200+" },
        { label: "Professional drivers", value: "150+" },
        { label: "Years of experience", value: "5+" }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white pt-32 pb-20">
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="relative max-w-7xl mx-auto px-6 text-center">
                    <h1 className="text-5xl md:text-6xl font-bold mb-6">
                        About Us
                    </h1>
                    <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
                        A leading electric car rental provider in Ho Chi Minh City, delivering modern and sustainable mobility.
                    </p>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat, index) => (
                            <div key={index} className="text-center">
                                <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">
                                    {stat.value}
                                </div>
                                <div className="text-gray-600 font-medium">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Story Section */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-4xl font-bold text-gray-900 mb-6">
                                Our story
                            </h2>
                            <div className="space-y-4 text-gray-600 text-lg leading-relaxed">
                                <p>
                                    <strong className="text-gray-900">LuxeDrive</strong> was founded in 2021 with a mission to deliver eco-friendly transportation solutions for the Ho Chi Minh City community.
                                </p>
                                <p>
                                    We believe the future of mobility is electric: clean, efficient, and sustainable. With a 100% electric fleet, from premium sedans to versatile SUVs, we serve every travel need.
                                </p>
                                <p>
                                    After 5 years of growth, LuxeDrive is proud to be a trusted partner of over 10,000 customers and businesses. We continuously improve service quality, invest in technology, and train our team.
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <img
                                src="https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=400&h=300&fit=crop"
                                alt="Electric car charging"
                                className="rounded-2xl shadow-lg w-full h-64 object-cover"
                            />
                            <img
                                src="https://images.unsplash.com/photo-1617788138017-80ad40651399?w=400&h=300&fit=crop"
                                alt="Modern electric vehicle"
                                className="rounded-2xl shadow-lg w-full h-64 object-cover mt-8"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Why choose LuxeDrive?
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            We are committed to delivering top-tier electric car rental services with outstanding value.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-8 border border-gray-200 hover:shadow-xl transition-all hover:scale-105"
                            >
                                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-6">
                                    <feature.icon className="text-white" size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-600">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Mission Section */}
            <section className="py-20 bg-gradient-to-br from-blue-900 to-indigo-900 text-white">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <h2 className="text-4xl font-bold mb-6">Our mission</h2>
                    <p className="text-xl md:text-2xl text-blue-100 max-w-4xl mx-auto leading-relaxed">
                        "Building a green transportation ecosystem, contributing to environmental protection and improving the quality of community life through popularizing electric vehicles and professional and convenient rental services."
                    </p>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-4xl font-bold text-gray-900 mb-6">
                        Ready to experience it?
                    </h2>
                    <p className="text-xl text-gray-600 mb-8">
                        Book our electric vehicles today and explore the city in a greener way.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a
                            href="/fleet"
                            className="px-8 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30"
                        >
                            Browse fleet
                        </a>
                        <a
                            href="/contact"
                            className="px-8 py-4 bg-white text-blue-600 rounded-xl font-bold text-lg hover:bg-gray-50 transition-colors border-2 border-blue-600"
                        >
                            Contact us
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default About;
