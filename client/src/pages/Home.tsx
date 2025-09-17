import { motion } from "framer-motion";
import { ArrowRight, Shield, Zap, Globe, TrendingUp } from "lucide-react";
import { BorderMagicButton } from "@/components/BorderMagicButton";
import { GlassCard } from "@/components/GlassCard";
import { TextType } from "@/components/TextType";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-bg.jpg";

const Home = () => {
  const features = [
    {
      icon: Shield,
      title: "Secure Transfers",
      description: "Bank-grade security with blockchain transparency",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Cross-border transfers in seconds, not days",
    },
    {
      icon: Globe,
      title: "Global Reach",
      description: "Send stablecoins anywhere in the world",
    },
    {
      icon: TrendingUp,
      title: "Low Fees",
      description: "Minimal transaction costs with maximum value",
    },
  ];

  const stats = [
    { label: "Countries Supported", value: "180+" },
    { label: "Total Volume", value: "$2.5B+" },
    { label: "Active Users", value: "50K+" },
    { label: "Average Speed", value: "< 30s" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-gradient-dark"
          style={{ 
            backgroundImage: `url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />
        <div className="absolute inset-0 bg-background/60" />
        
        <motion.div
          className="relative z-10 container mx-auto px-6 text-center"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <div className="max-w-4xl mx-auto">
            <motion.div
              className="mb-6"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <TextType
                text="Bit Bridge"
                className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-primary via-purple-400 to-blue-400 bg-clip-text text-transparent mb-4"
              />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.8 }}
            >
              <TextType
                text="Connecting Wallets, Crossing Worlds"
                className="text-3xl md:text-2xl text-muted-foreground mb-8"
                delay={2000}
              />
            </motion.div>

            <motion.p
              className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 3, duration: 1 }}
            >
              Experience the future of cross-border payments with our decentralized 
              stablecoin remittance platform powered by Algorand blockchain.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 3.5, duration: 0.8 }}
            >
              <Link to="/send">
                <BorderMagicButton className="flex items-center space-x-2">
                  <span>Start Sending</span>
                  <ArrowRight className="w-4 h-4" />
                </BorderMagicButton>
              </Link>
              
              <Button variant="ghost" size="lg" className="text-foreground hover:text-primary">
                Learn More
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-primary/20 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -100, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-b from-background to-background/50">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
              >
                <div className="text-3xl md:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Why Choose <span className="bg-gradient-primary bg-clip-text text-transparent">Bit Bridge</span>?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Experience the next generation of financial services with our cutting-edge technology
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
              >
                <GlassCard className="p-6 h-full" glare>
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mb-4">
                      <feature.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-t from-background to-background/50">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Bridge the Gap?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of users who trust Bit Bridge for their cross-border payments
            </p>
            <Link to="/send">
              <BorderMagicButton className="flex items-center space-x-2">
                <span>Get Started Now</span>
                <ArrowRight className="w-4 h-4" />
              </BorderMagicButton>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;