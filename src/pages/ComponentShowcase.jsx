import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Button from "@components/common/Button";
import { Badge } from "@components/common/Badge";
import { Skeleton, TableSkeleton, CardSkeleton, StatCardSkeleton, ListSkeleton } from "@components/common/Skeleton";
import { ProgressBar, CircularProgress, Spinner, DotLoader } from "@components/common/ProgressIndicator";
import { AnimatedCounter, StatCard } from "@components/common/AnimatedCounter";
import Breadcrumb from "@components/common/Breadcrumb";
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  SparklesIcon,
  RocketLaunchIcon,
  ChartBarIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  TrendingUpIcon
} from "@heroicons/react/24/outline";

export default function ComponentShowcase() {
  const [progress, setProgress] = useState(65);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Component Showcase - BW Industrial";
  }, []);

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Components", href: "#" },
    { label: "Showcase" },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#181818] py-8 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-[#222] dark:text-[#f5efe6] mb-2 gradient-text">
            Component Showcase
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Explore all the new animated components and design enhancements
          </p>
        </motion.div>

        <Breadcrumb items={breadcrumbItems} className="mb-8" />

        {/* Buttons Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-[#222] dark:text-[#f5efe6] mb-4">Buttons</h2>
          <div className="bg-[#f7f6f3] dark:bg-[#222] p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-4 mb-4">
              <Button variant="primary">Primary Button</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="success" icon={CheckCircleIcon}>Success</Button>
              <Button variant="danger" icon={XCircleIcon} iconPosition="right">Danger</Button>
              <Button variant="ocean">Ocean</Button>
              <Button variant="ghost">Ghost</Button>
            </div>
            <div className="flex flex-wrap gap-4 mb-4">
              <Button variant="primary" size="sm">Small</Button>
              <Button variant="primary" size="md">Medium</Button>
              <Button variant="primary" size="lg">Large</Button>
              <Button variant="primary" size="xl">Extra Large</Button>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button variant="primary" disabled>Disabled</Button>
              <Button variant="primary" loading onClick={() => setLoading(!loading)}>
                {loading ? "Loading..." : "Toggle Loading"}
              </Button>
              <Button variant="success" icon={SparklesIcon}>With Icon</Button>
            </div>
          </div>
        </motion.section>

        {/* Badges Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-[#222] dark:text-[#f5efe6] mb-4">Badges</h2>
          <div className="bg-[#f7f6f3] dark:bg-[#222] p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-3 mb-4">
              <Badge variant="success" icon={CheckCircleIcon}>Success</Badge>
              <Badge variant="error" icon={XCircleIcon}>Error</Badge>
              <Badge variant="warning" icon={ExclamationTriangleIcon}>Warning</Badge>
              <Badge variant="info" icon={InformationCircleIcon}>Info</Badge>
              <Badge variant="processing">Processing</Badge>
              <Badge variant="default">Default</Badge>
            </div>
            <div className="flex flex-wrap gap-3 mb-4">
              <Badge variant="success" pulse>Live</Badge>
              <Badge variant="processing" pulse>Processing</Badge>
              <Badge variant="error" pulse>Alert</Badge>
            </div>
            <div className="flex flex-wrap gap-3">
              <Badge variant="success" size="sm">Small</Badge>
              <Badge variant="info" size="md">Medium</Badge>
              <Badge variant="warning" size="lg">Large</Badge>
            </div>
          </div>
        </motion.section>

        {/* Progress Indicators Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-[#222] dark:text-[#f5efe6] mb-4">Progress Indicators</h2>
          <div className="bg-[#f7f6f3] dark:bg-[#222] p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="space-y-6 mb-6">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">Progress Bar - Primary</label>
                <ProgressBar progress={progress} variant="primary" />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">Progress Bar - Success</label>
                <ProgressBar progress={85} variant="success" />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">Progress Bar - Warning</label>
                <ProgressBar progress={45} variant="warning" />
              </div>
              <div className="flex items-center gap-4">
                <Button size="sm" onClick={() => setProgress(Math.max(0, progress - 10))}>-</Button>
                <Button size="sm" onClick={() => setProgress(Math.min(100, progress + 10))}>+</Button>
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-6 mb-6">
              <div className="text-center">
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">Circular - Primary</label>
                <CircularProgress progress={progress} size={100} variant="primary" />
              </div>
              <div className="text-center">
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">Circular - Success</label>
                <CircularProgress progress={75} size={100} variant="success" />
              </div>
              <div className="text-center">
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">Circular - Warning</label>
                <CircularProgress progress={50} size={100} variant="warning" />
              </div>
              <div className="text-center">
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">Circular - Danger</label>
                <CircularProgress progress={25} size={100} variant="danger" />
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div className="text-center">
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">Spinner</label>
                <Spinner size="lg" />
              </div>
              <div className="text-center">
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">Dot Loader</label>
                <DotLoader />
              </div>
            </div>
          </div>
        </motion.section>

        {/* Animated Counters Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-[#222] dark:text-[#f5efe6] mb-4">Animated Counters & Stats</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <StatCard
              title="Total Revenue"
              value={125000}
              prefix="$"
              icon={CurrencyDollarIcon}
              trend="up"
              trendValue="12%"
              variant="success"
            />
            <StatCard
              title="Active Users"
              value={3420}
              icon={UserGroupIcon}
              trend="up"
              trendValue="8%"
              variant="primary"
            />
            <StatCard
              title="Conversion Rate"
              value={3.45}
              suffix="%"
              decimals={2}
              icon={TrendingUpIcon}
              trend="down"
              trendValue="2%"
              variant="warning"
            />
            <StatCard
              title="Total Projects"
              value={48}
              icon={ChartBarIcon}
              variant="ocean"
            />
          </div>
        </motion.section>

        {/* Skeleton Loaders Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-[#222] dark:text-[#f5efe6] mb-4">Skeleton Loaders</h2>
          <div className="space-y-6">
            <div className="bg-[#f7f6f3] dark:bg-[#222] p-6 rounded-xl border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-[#222] dark:text-[#f5efe6] mb-4">Basic Skeletons</h3>
              <div className="space-y-3">
                <Skeleton variant="text" />
                <Skeleton variant="text" className="w-3/4" />
                <Skeleton variant="title" />
                <div className="flex gap-4">
                  <Skeleton variant="avatar" />
                  <div className="flex-1 space-y-2">
                    <Skeleton variant="text" />
                    <Skeleton variant="text" className="w-2/3" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#f7f6f3] dark:bg-[#222] p-6 rounded-xl border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-[#222] dark:text-[#f5efe6] mb-4">Card Skeleton</h3>
              <CardSkeleton />
            </div>

            <div className="bg-[#f7f6f3] dark:bg-[#222] p-6 rounded-xl border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-[#222] dark:text-[#f5efe6] mb-4">List Skeleton</h3>
              <ListSkeleton items={3} />
            </div>

            <div className="bg-[#f7f6f3] dark:bg-[#222] p-6 rounded-xl border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-[#222] dark:text-[#f5efe6] mb-4">Table Skeleton</h3>
              <TableSkeleton rows={4} columns={5} />
            </div>
          </div>
        </motion.section>

        {/* Animation Examples */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-[#222] dark:text-[#f5efe6] mb-4">Animation Examples</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-[#f7f6f3] dark:bg-[#222] p-6 rounded-xl border border-gray-200 dark:border-gray-700 text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-lg mx-auto mb-3 animate-float" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Float Animation</p>
            </div>

            <div className="bg-[#f7f6f3] dark:bg-[#222] p-6 rounded-xl border border-gray-200 dark:border-gray-700 text-center">
              <RocketLaunchIcon className="w-16 h-16 text-blue-500 mx-auto mb-3 animate-bounce-in" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Bounce In</p>
            </div>

            <div className="bg-[#f7f6f3] dark:bg-[#222] p-6 rounded-xl border border-gray-200 dark:border-gray-700 text-center hover-lift">
              <SparklesIcon className="w-16 h-16 text-blue-500 mx-auto mb-3" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Hover Lift (Hover me)</p>
            </div>

            <div className="bg-[#f7f6f3] dark:bg-[#222] p-6 rounded-xl border border-gray-200 dark:border-gray-700 text-center hover-scale">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg mx-auto mb-3" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Hover Scale (Hover me)</p>
            </div>

            <div className="bg-[#f7f6f3] dark:bg-[#222] p-6 rounded-xl border border-gray-200 dark:border-gray-700 text-center hover-glow">
              <div className="w-16 h-16 bg-blue-500 rounded-lg mx-auto mb-3" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Hover Glow (Hover me)</p>
            </div>

            <div className="bg-[#f7f6f3] dark:bg-[#222] p-6 rounded-xl border border-gray-200 dark:border-gray-700 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-gradient-shift rounded-lg mx-auto mb-3" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Gradient Shift</p>
            </div>
          </div>
        </motion.section>

        {/* Gradient Text */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <h2 className="text-5xl font-bold gradient-text mb-4">
            Beautiful Gradient Text
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Using the gradient-text utility class for stunning typography
          </p>
        </motion.section>
      </div>
    </div>
  );
}
