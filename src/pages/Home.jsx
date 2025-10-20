import { useTranslation } from "react-i18next";
import { ChartBarIcon, ClockIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import HeroSection from "@components/home/HeroSection";
import FeaturesSection from "@components/home/FeaturesSection";
import { motion } from "framer-motion";

export default function Home() {
  const { i18n } = useTranslation();
  const language = i18n.language;

  const content = {
    en: {
      title: "BW Industrial Development Joint Stock Company",
      subtitle: "Finance Automation Team - Data Processing System",
      intro: "Welcome to the BW Industrial Development Joint Stock Company's data processing platform, developed and managed by our Finance-Automation team.",
      exploreDepts: "Explore Departments",
      aboutTitle: "About BW Industrial",
      aboutText: "BW Industrial Development Joint Stock Company is a leading enterprise specializing in industrial development and infrastructure. We are committed to delivering innovative solutions and maintaining excellence in all our operations.",
      teamTitle: "Finance-Automation Team",
      teamText: "Our Finance-Automation team focuses on streamlining financial operations through advanced data processing systems. We develop and maintain internal tools that enhance efficiency, accuracy, and transparency across all departments.",
      features: [
        {
          icon: ChartBarIcon,
          title: "Data Processing",
          description: "Advanced analytics and automated data processing for financial operations"
        },
        {
          icon: ClockIcon,
          title: "Real-time Updates",
          description: "Live data synchronization and instant reporting capabilities"
        },
        {
          icon: ShieldCheckIcon,
          title: "Secure & Reliable",
          description: "Enterprise-grade security with automated backup systems"
        }
      ]
    },
    vi: {
      title: "Công ty Cổ phần Phát triển Công nghiệp BW",
      subtitle: "Đội Tự động hóa Tài chính - Hệ thống Xử lý Dữ liệu",
      intro: "Chào mừng đến với nền tảng xử lý dữ liệu của Công ty Cổ phần Phát triển Công nghiệp BW, được phát triển và quản lý bởi đội Tự động hóa Tài chính.",
      exploreDepts: "Khám phá Phòng ban",
      aboutTitle: "Về BW Industrial",
      aboutText: "Công ty Cổ phần Phát triển Công nghiệp BW là doanh nghiệp hàng đầu chuyên về phát triển công nghiệp và cơ sở hạ tầng. Chúng tôi cam kết mang đến các giải pháp đổi mới và duy trì sự xuất sắc trong mọi hoạt động.",
      teamTitle: "Đội Tự động hóa Tài chính",
      teamText: "Đội Tự động hóa Tài chính của chúng tôi tập trung vào việc tối ưu hóa các hoạt động tài chính thông qua hệ thống xử lý dữ liệu tiên tiến. Chúng tôi phát triển và duy trì các công cụ nội bộ giúp nâng cao hiệu quả, độ chính xác và tính minh bạch trên tất cả các phòng ban.",
      features: [
        {
          icon: ChartBarIcon,
          title: "Xử lý Dữ liệu",
          description: "Phân tích nâng cao và xử lý dữ liệu tự động cho hoạt động tài chính"
        },
        {
          icon: ClockIcon,
          title: "Cập nhật Thời gian Thực",
          description: "Đồng bộ dữ liệu trực tiếp và khả năng báo cáo tức thì"
        },
        {
          icon: ShieldCheckIcon,
          title: "An toàn & Đáng tin cậy",
          description: "Bảo mật cấp doanh nghiệp với hệ thống sao lưu tự động"
        }
      ]
    }
  };

  const currentContent = content[language];

  return (
    <div className="min-h-screen bg-white dark:bg-[#181818]">
      <HeroSection content={currentContent} />

      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-12 mb-16">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            whileHover={{ scale: 1.02, y: -5 }}
            className="bg-[#f7f6f3] dark:bg-[#222] p-8 rounded-2xl shadow-md hover:shadow-xl transition-shadow border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
          >
            <h2 className="text-2xl font-bold text-[#222] dark:text-[#f5efe6] mb-4">
              {currentContent.aboutTitle}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {currentContent.aboutText}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            whileHover={{ scale: 1.02, y: -5 }}
            className="bg-[#f7f6f3] dark:bg-[#222] p-8 rounded-2xl shadow-md hover:shadow-xl transition-shadow border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
          >
            <h2 className="text-2xl font-bold text-[#222] dark:text-[#f5efe6] mb-4">
              {currentContent.teamTitle}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {currentContent.teamText}
            </p>
          </motion.div>
        </div>

        <FeaturesSection content={currentContent} language={language} />
      </div>
    </div>
  );
}
