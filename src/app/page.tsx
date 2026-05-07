"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  FileJson,
  Network,
  Sparkles,
  Waypoints,
} from "lucide-react";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { useTheme } from "@/hooks/use-theme";
import { useLanguage } from "@/hooks/use-language";

import type { Engine, ISourceOptions } from "@tsparticles/engine";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function LandingPage() {
  const [init, setInit] = useState(false);
  const { mounted, theme } = useTheme();
  const { t } = useLanguage();
  const activeTheme = mounted ? theme : "dark";

  useEffect(() => {
    initParticlesEngine(async (engine: Engine) => {
      try {
        await loadSlim(engine);
        setInit(true);
      } catch (error) {
        console.error("Particles: Error during loadSlim:", error);
      }
    }).catch((error) => {
      console.error("Particles: Error initializing tsparticles engine:", error);
    });
  }, []);

  const text = {
    badge: t("landing.badge"),
    title: t("landing.title"),
    subtitle: t("landing.subtitle"),
    cta: t("landing.cta"),
    pills: [
      t("landing.pillAlgorithms"),
      t("landing.pillMatrixJson"),
      t("landing.pillStats"),
    ],
    why: t("landing.why"),
    whyTitle: t("landing.whyTitle"),
    cards: [
      {
        title: t("landing.buildTitle"),
        desc: t("landing.buildDesc"),
        icon: Network,
      },
      {
        title: t("landing.visualizeTitle"),
        desc: t("landing.visualizeDesc"),
        icon: Waypoints,
      },
      {
        title: t("landing.exportTitle"),
        desc: t("landing.exportDesc"),
        icon: FileJson,
      },
    ],
    stats: [
      { value: "8+", label: t("landing.statAlgorithms") },
      { value: "Live", label: t("landing.statVisualization") },
      { value: "JSON", label: t("landing.statExport") },
    ],
    reserved: t("landing.reserved"),
    creditsPrefix: t("landing.creditsPrefix"),
    creditsSuffix: t("landing.creditsSuffix"),
    appName: t("landing.appName"),
  };

  const particlesOptions = useMemo<ISourceOptions>(
    () => ({
      background: {
        color: {
          value: activeTheme === "dark" ? "#0b0f0c" : "#f4f7f4",
        },
      },
      fpsLimit: 60,
      interactivity: {
        events: {
          onHover: {
            enable: true,
            mode: "grab" as const,
          },
          onClick: {
            enable: true,
            mode: "push" as const,
          },
        },
        modes: {
          grab: {
            distance: 140,
            links: {
              opacity: 0.35,
            },
          },
          push: {
            quantity: 3,
          },
        },
      },
      particles: {
        color: {
          value: activeTheme === "dark" ? "#44d27d" : "#269454",
        },
        links: {
          color: activeTheme === "dark" ? "#44d27d" : "#269454",
          distance: 150,
          enable: true,
          opacity: 0.2,
          width: 1,
        },
        collisions: {
          enable: true,
        },
        move: {
          direction: "none" as const,
          enable: true,
          outModes: {
            default: "bounce" as const,
          },
          random: false,
          speed: 0.5,
          straight: false,
        },
        number: {
          density: {
            enable: true,
            area: 800,
          },
          value: 70,
        },
        opacity: {
          value: 0.4,
        },
        shape: {
          type: "circle" as const,
        },
        size: {
          value: { min: 1, max: 3 },
        },
      },
      detectRetina: true,
    }),
    [activeTheme]
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.14,
        delayChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 22 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 110,
        damping: 14,
      },
    },
  };

  const hoverGlow =
    activeTheme === "dark"
      ? "0px 0px 30px rgba(68, 210, 125, 0.18)"
      : "0px 0px 28px rgba(38, 148, 84, 0.16)";

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background text-foreground">
      {init && (
        <Particles
          id="tsparticles-landing"
          options={particlesOptions}
          className="absolute inset-0 z-0"
        />
      )}

      <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden">
        <div className="absolute left-[-6rem] top-24 h-56 w-56 rounded-full bg-primary/12 blur-3xl" />
        <div className="absolute right-[-5rem] top-32 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute bottom-[-5rem] left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="absolute right-6 top-6 z-20 flex items-center gap-2">
        <LanguageToggle />
        <ThemeToggle />
      </div>

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 items-center px-6 py-10 sm:py-14">
        <motion.div
          className="grid w-full items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <div>
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary shadow-sm backdrop-blur-md"
            >
              <Sparkles className="h-4 w-4" />
              {text.badge}
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="mt-6 max-w-[11ch] text-5xl font-black leading-[0.94] text-foreground sm:text-6xl lg:text-7xl"
            >
              {text.title}
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg"
            >
              {text.subtitle}
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Link
                href="/app"
                className={cn(
                  "inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300 hover:translate-y-[-1px] hover:shadow-xl hover:shadow-primary/25 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                )}
              >
                {text.cta} <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="mt-8 flex flex-wrap gap-3"
            >
              {text.pills.map((pill) => (
                <span
                  key={pill}
                  className="rounded-full border border-border/70 bg-card/65 px-4 py-2 text-sm text-foreground/90 backdrop-blur-md"
                >
                  {pill}
                </span>
              ))}
            </motion.div>
          </div>

          <motion.div variants={itemVariants} className="relative">
            <div className="absolute inset-6 rounded-[32px] bg-primary/15 blur-3xl" />

            <div className="relative overflow-hidden rounded-[30px] border border-border/70 bg-card/82 p-5 shadow-2xl backdrop-blur-xl sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
                    {text.why}
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-foreground">
                    {text.whyTitle}
                  </h2>
                </div>
                <div className="rounded-2xl border border-primary/20 bg-primary/10 p-3 text-primary">
                  <BarChart3 className="h-6 w-6" />
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                {text.stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-border/60 bg-background/55 px-3 py-4 text-center"
                  >
                    <div className="text-xl font-black text-primary sm:text-2xl">
                      {stat.value}
                    </div>
                    <div className="mt-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-3">
                {text.cards.map(({ title, desc, icon: Icon }) => (
                  <motion.div
                    key={title}
                    className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/45 p-4"
                    whileHover={{
                      y: -2,
                      boxShadow: hoverGlow,
                    }}
                    transition={{ type: "spring", stiffness: 240, damping: 22 }}
                  >
                    <div className="rounded-xl bg-primary/12 p-2 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground sm:text-base">
                        {title}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {desc}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </main>

      <footer className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-8 text-center text-sm text-muted-foreground">
        <p>
          © {new Date().getFullYear()}{" "}
          <span className="font-medium text-primary">{text.appName}</span>.{" "}
          {text.reserved}
        </p>
        <p className="mt-1">
          {text.creditsPrefix}{" "}
          <span className="text-red-500 animate-pulse">❤️</span>{" "}
          {text.creditsSuffix}
        </p>
      </footer>
    </div>
  );
}
