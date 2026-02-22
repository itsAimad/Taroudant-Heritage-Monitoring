import { motion } from 'framer-motion';
import { Shield, BookOpen, Users, Database, Lock, Mail } from 'lucide-react';

const About = () => {
  return (
    <div className="min-h-screen bg-background pt-20 px-4 sm:px-6 lg:px-8 pb-12">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-sm text-muted-foreground font-mono tracking-wider uppercase">About the Project</span>
          </div>
          <h1 className="font-heading text-4xl text-foreground mb-6">Taroudant Heritage Shield</h1>
          <p className="text-lg text-muted-foreground leading-relaxed mb-12">
            A comprehensive digital monitoring system for the preservation and vulnerability assessment of Taroudant's historic ramparts and monuments. This project combines advanced risk assessment methodologies with interactive data visualization to support cultural heritage conservation.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {[
            { icon: BookOpen, title: 'Academic Context', desc: 'Developed as part of a university research initiative focused on digital heritage preservation. Combines computer science, architectural conservation, and risk assessment disciplines.' },
            { icon: Users, title: 'Research Team', desc: 'A multidisciplinary team of researchers, engineers, and heritage conservation specialists collaborating to develop innovative monitoring solutions.' },
            { icon: Database, title: 'Technical Architecture', desc: 'Built on a robust database architecture with 3NF normalization, stored procedures for risk calculation, and triggers for automated alert generation.' },
            { icon: Lock, title: 'Security & Access', desc: 'Role-based access control (RBAC) with three distinct roles: Administrator, Inspector, and Viewer. Each role has carefully defined permissions.' },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-card border border-border rounded-lg p-6"
            >
              <item.icon className="h-6 w-6 text-primary mb-3" />
              <h3 className="font-heading text-lg text-foreground mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Methodology */}
        <div className="bg-card border border-border rounded-lg p-8 mb-12">
          <h2 className="font-heading text-2xl text-foreground mb-4">Methodology</h2>
          <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
            <p>The risk assessment methodology employs a weighted multi-factor analysis considering four primary variables:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-foreground">Age Factor (25%)</strong> — Normalized assessment of structural age relative to expected material lifespan</li>
              <li><strong className="text-foreground">Humidity Factor (30%)</strong> — Environmental moisture measurements indicating water damage potential</li>
              <li><strong className="text-foreground">Crack Severity (25%)</strong> — Structural crack assessment on a standardized 0-3 scale</li>
              <li><strong className="text-foreground">Erosion Depth (20%)</strong> — Physical measurement of material loss in centimeters</li>
            </ul>
            <p className="font-mono text-xs bg-muted/50 p-3 rounded mt-4">
              Risk Index = (Age/500 × 25) + (Humidity/100 × 30) + (CrackSeverity/3 × 25) + (ErosionDepth/50 × 20) + SeismicBonus
            </p>
          </div>
        </div>

        {/* Objectives */}
        <div className="mb-12">
          <h2 className="font-heading text-2xl text-foreground mb-6">Project Objectives</h2>
          <div className="space-y-3">
            {[
              'Create a comprehensive digital inventory of Taroudant\'s heritage monuments',
              'Implement automated risk assessment and early warning systems',
              'Provide tools for systematic inspection and reporting',
              'Enable data-driven decision-making for conservation priorities',
              'Demonstrate the application of database technologies in heritage preservation',
            ].map((obj, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="font-mono text-xs text-primary bg-primary/10 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                <p className="text-sm text-muted-foreground">{obj}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="bg-card border border-border rounded-lg p-6 text-center">
          <Mail className="h-6 w-6 text-primary mx-auto mb-3" />
          <h3 className="font-heading text-lg text-foreground mb-2">Contact</h3>
          <p className="text-sm text-muted-foreground">For inquiries about this project, please contact the research team at:</p>
          <p className="font-mono text-sm text-primary mt-2">heritage.shield@univ-taroudant.ma</p>
        </div>
      </div>
    </div>
  );
};

export default About;
