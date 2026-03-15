import { Car, Users, Award, Shield, Zap, Leaf } from "lucide-react";

const About = () => {
    const features = [
        {
            icon: Car,
            title: "Đội xe hiện đại",
            description: "100% xe điện cao cấp, được bảo dưỡng định kỳ và đảm bảo chất lượng tốt nhất"
        },
        {
            icon: Users,
            title: "Đội ngũ chuyên nghiệp",
            description: "Tài xế giàu kinh nghiệm, nhiệt tình và luôn sẵn sàng phục vụ khách hàng 24/7"
        },
        {
            icon: Award,
            title: "Dịch vụ uy tín",
            description: "Hơn 5 năm kinh nghiệm trong lĩnh vực cho thuê xe điện tại TP.HCM"
        },
        {
            icon: Shield,
            title: "Bảo hiểm toàn diện",
            description: "Mọi xe đều có bảo hiểm đầy đủ, đảm bảo an tâm cho hành trình của bạn"
        },
        {
            icon: Zap,
            title: "Đặt xe nhanh chóng",
            description: "Hệ thống đặt xe online tiện lợi, xác nhận chỉ trong vài phút"
        },
        {
            icon: Leaf,
            title: "Thân thiện môi trường",
            description: "100% xe điện, góp phần giảm ô nhiễm và bảo vệ môi trường xanh"
        }
    ];

    const stats = [
        { label: "Khách hàng hài lòng", value: "10,000+" },
        { label: "Xe điện cao cấp", value: "200+" },
        { label: "Tài xế chuyên nghiệp", value: "150+" },
        { label: "Năm kinh nghiệm", value: "5+" }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white pt-32 pb-20">
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="relative max-w-7xl mx-auto px-6 text-center">
                    <h1 className="text-5xl md:text-6xl font-bold mb-6">
                        Về Chúng Tôi
                    </h1>
                    <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
                        Đơn vị cho thuê xe điện hàng đầu tại TP.HCM, mang đến trải nghiệm di chuyển xanh, hiện đại và đẳng cấp
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
                                Câu chuyện của chúng tôi
                            </h2>
                            <div className="space-y-4 text-gray-600 text-lg leading-relaxed">
                                <p>
                                    <strong className="text-gray-900">LuxeDrive</strong> được thành lập vào năm 2021 với sứ mệnh mang đến giải pháp di chuyển xanh, thân thiện với môi trường cho cộng đồng TP.HCM.
                                </p>
                                <p>
                                    Chúng tôi tin rằng tương lai của giao thông là xe điện - sạch, hiệu quả và bền vững. Với đội xe 100% điện hóa, từ những mẫu sedan sang trọng đến SUV đa dụng, chúng tôi đáp ứng mọi nhu cầu di chuyển của bạn.
                                </p>
                                <p>
                                    Sau 5 năm phát triển, LuxeDrive tự hào là đối tác tin cậy của hơn 10,000 khách hàng và doanh nghiệp. Chúng tôi không ngừng nâng cao chất lượng dịch vụ, đầu tư công nghệ và đào tạo đội ngũ để mang đến trải nghiệm tốt nhất.
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
                            Tại sao chọn LuxeDrive?
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Chúng tôi cam kết mang đến dịch vụ cho thuê xe điện tốt nhất với những giá trị vượt trội
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
                    <h2 className="text-4xl font-bold mb-6">Sứ mệnh của chúng tôi</h2>
                    <p className="text-xl md:text-2xl text-blue-100 max-w-4xl mx-auto leading-relaxed">
                        "Xây dựng hệ sinh thái giao thông xanh, góp phần bảo vệ môi trường và nâng cao chất lượng cuộc sống cộng đồng thông qua việc phổ cập xe điện và dịch vụ cho thuê chuyên nghiệp, tiện lợi."
                    </p>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-4xl font-bold text-gray-900 mb-6">
                        Sẵn sàng trải nghiệm?
                    </h2>
                    <p className="text-xl text-gray-600 mb-8">
                        Đặt xe điện của chúng tôi ngay hôm nay và khám phá thành phố theo cách thân thiện với môi trường
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a
                            href="/fleet"
                            className="px-8 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30"
                        >
                            Xem đội xe
                        </a>
                        <a
                            href="/contact"
                            className="px-8 py-4 bg-white text-blue-600 rounded-xl font-bold text-lg hover:bg-gray-50 transition-colors border-2 border-blue-600"
                        >
                            Liên hệ ngay
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default About;
