import { useState } from "react";
import { MapPin, Phone, Mail, Clock, Send, CheckCircle } from "lucide-react";

const Contact = () => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: ""
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const contactInfo = [
        {
            icon: MapPin,
            title: "Địa chỉ",
            content: "123 Võ Văn Ngân, Phường Linh Chiểu, TP. Thủ Đức, TP.HCM",
            color: "text-red-600"
        },
        {
            icon: Phone,
            title: "Điện thoại",
            content: "(028) 1234 5678",
            subContent: "Hotline: 1900-xxxx",
            color: "text-green-600"
        },
        {
            icon: Mail,
            title: "Email",
            content: "info@luxedrive.vn",
            subContent: "support@luxedrive.vn",
            color: "text-blue-600"
        },
        {
            icon: Clock,
            title: "Giờ làm việc",
            content: "Thứ 2 - Thứ 7: 8:00 - 20:00",
            subContent: "Chủ nhật: 9:00 - 18:00",
            color: "text-purple-600"
        }
    ];

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        // Simulate API call
        setTimeout(() => {
            setSubmitting(false);
            setSubmitted(true);
            setFormData({
                name: "",
                email: "",
                phone: "",
                subject: "",
                message: ""
            });

            // Reset success message after 5 seconds
            setTimeout(() => {
                setSubmitted(false);
            }, 5000);
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white pt-32 pb-20">
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="relative max-w-7xl mx-auto px-6 text-center">
                    <h1 className="text-5xl md:text-6xl font-bold mb-6">
                        Liên Hệ Với Chúng Tôi
                    </h1>
                    <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
                        Chúng tôi luôn sẵn sàng hỗ trợ bạn. Hãy liên hệ để được tư vấn và đặt xe ngay hôm nay!
                    </p>
                </div>
            </section>

            {/* Contact Info Cards */}
            <section className="py-16 -mt-10">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {contactInfo.map((info, index) => (
                            <div
                                key={index}
                                className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all hover:scale-105"
                            >
                                <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${info.color} bg-gray-50`}>
                                    <info.icon size={28} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">
                                    {info.title}
                                </h3>
                                <p className="text-gray-600 text-sm">
                                    {info.content}
                                </p>
                                {info.subContent && (
                                    <p className="text-gray-500 text-sm mt-1">
                                        {info.subContent}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Contact Form & Map */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-12">
                        {/* Contact Form */}
                        <div>
                            <h2 className="text-4xl font-bold text-gray-900 mb-4">
                                Gửi tin nhắn cho chúng tôi
                            </h2>
                            <p className="text-gray-600 mb-8">
                                Điền thông tin vào form bên dưới và chúng tôi sẽ phản hồi trong vòng 24 giờ
                            </p>

                            {submitted && (
                                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
                                    <CheckCircle className="text-green-600" size={24} />
                                    <div>
                                        <p className="font-bold text-green-900">Gửi thành công!</p>
                                        <p className="text-sm text-green-700">Chúng tôi sẽ liên hệ lại với bạn sớm nhất.</p>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Họ và tên <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                                            placeholder="Nguyễn Văn A"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Email <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                                            placeholder="email@example.com"
                                        />
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Số điện thoại <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                                            placeholder="0901234567"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Chủ đề <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="subject"
                                            value={formData.subject}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                                        >
                                            <option value="">Chọn chủ đề</option>
                                            <option value="booking">Đặt xe</option>
                                            <option value="pricing">Giá cả</option>
                                            <option value="support">Hỗ trợ kỹ thuật</option>
                                            <option value="feedback">Góp ý</option>
                                            <option value="other">Khác</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        Nội dung <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        required
                                        rows={6}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none"
                                        placeholder="Nhập nội dung tin nhắn của bạn..."
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            Đang gửi...
                                        </>
                                    ) : (
                                        <>
                                            <Send size={20} />
                                            Gửi tin nhắn
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* Map & Additional Info */}
                        <div className="space-y-6">
                            {/* Google Map */}
                            <div className="bg-white rounded-2xl shadow-lg overflow-hidden h-[400px]">
                                <iframe
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3918.4544374621355!2d106.76933631533419!3d10.850632860780469!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752763f23816ab%3A0x282f711441b3916f!2zVHLGsOG7nW5nIMSQ4bqhaSBo4buNYyBGUFQgVFAuSENNIChDxqEgc-G7nyAy!5e0!3m2!1svi!2s!4v1234567890"
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    allowFullScreen=""
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    title="LuxeDrive Location"
                                ></iframe>
                            </div>

                            {/* FAQ */}
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200">
                                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                                    Câu hỏi thường gặp
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="font-bold text-gray-900 mb-1">Làm sao để đặt xe?</h4>
                                        <p className="text-gray-600 text-sm">
                                            Bạn có thể đặt xe trực tiếp trên website hoặc liên hệ hotline để được hỗ trợ.
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 mb-1">Có cần đặt cọc không?</h4>
                                        <p className="text-gray-600 text-sm">
                                            Có, tiền cọc là 30% tổng giá trị đơn hàng và sẽ được hoàn lại khi trả xe.
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 mb-1">Có hỗ trợ giao xe tận nơi?</h4>
                                        <p className="text-gray-600 text-sm">
                                            Có, chúng tôi hỗ trợ giao xe tận nơi trong khu vực TP.HCM.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-br from-blue-900 to-indigo-900 text-white">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-4xl font-bold mb-6">
                        Bạn cần tư vấn ngay?
                    </h2>
                    <p className="text-xl text-blue-100 mb-8">
                        Gọi hotline hoặc ghé thăm showroom của chúng tôi để trải nghiệm trực tiếp
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a
                            href="tel:02812345678"
                            className="px-8 py-4 bg-white text-blue-900 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg"
                        >
                            <Phone className="inline mr-2" size={20} />
                            Gọi ngay: (028) 1234 5678
                        </a>
                        <a
                            href="/fleet"
                            className="px-8 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-500 transition-colors border-2 border-white"
                        >
                            Xem đội xe
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Contact;
