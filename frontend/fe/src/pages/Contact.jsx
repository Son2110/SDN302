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
            title: "Address",
            content: "123 Vo Van Ngan, Linh Chieu Ward, City. Thu Duc, Ho Chi Minh City",
            color: "text-red-600"
        },
        {
            icon: Phone,
            title: "Phone",
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
            title: "Business hours",
            content: "Monday - Saturday: 8:00 - 20:00",
            subContent: "Sunday: 9:00 - 18:00",
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
                        Contact Us
                    </h1>
                    <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
                        We are always ready to help. Reach out for consultation and booking support.
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
                                Send us a message
                            </h2>
                            <p className="text-gray-600 mb-8">
                                Fill in the form below and we will reply within 24 hours.
                            </p>

                            {submitted && (
                                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
                                    <CheckCircle className="text-green-600" size={24} />
                                    <div>
                                        <p className="font-bold text-green-900">Sent successfully!</p>
                                        <p className="text-sm text-green-700">We will contact you as soon as possible.</p>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Full name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                                            placeholder="Nguyen Van A"
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
                                            Phone number <span className="text-red-500">*</span>
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
                                            Subject <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="subject"
                                            value={formData.subject}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                                        >
                                            <option value="">Select a subject</option>
                                            <option value="booking">Booking</option>
                                            <option value="pricing">Pricing</option>
                                            <option value="support">Technical support</option>
                                            <option value="feedback">Feedback</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        Message <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        required
                                        rows={6}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none"
                                        placeholder="Enter your message..."
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
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <Send size={20} />
                                            Send message
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
                                    Frequently asked questions
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="font-bold text-gray-900 mb-1">How can I book a vehicle?</h4>
                                        <p className="text-gray-600 text-sm">
                                            You can book directly on the website or contact our hotline for support.
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 mb-1">Is a deposit required?</h4>
                                        <p className="text-gray-600 text-sm">
                                            Yes. The deposit is 30% of your booking value and is settled according to the return process.
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 mb-1">Do you offer vehicle delivery?</h4>
                                        <p className="text-gray-600 text-sm">
                                            Yes, we support delivery within Ho Chi Minh City.
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
                        Need immediate consultation?
                    </h2>
                    <p className="text-xl text-blue-100 mb-8">
                        Call our hotline or visit our showroom for direct support.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a
                            href="tel:02812345678"
                            className="px-8 py-4 bg-white text-blue-900 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg"
                        >
                            <Phone className="inline mr-2" size={20} />
                            Call now: (028) 1234 5678
                        </a>
                        <a
                            href="/fleet"
                            className="px-8 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-500 transition-colors border-2 border-white"
                        >
                            Browse fleet
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Contact;
