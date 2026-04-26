"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { motion } from "framer-motion";
import { CalendarDays, Flag, Clock, CheckCircle } from "lucide-react";

export default function TimelinePage() {
  const timelineEvents = [
    {
      date: "October 7, 2024",
      title: "Voter Registration Deadline",
      description: "Last day to register to vote for the general election in most states.",
      icon: Clock,
      status: "past"
    },
    {
      date: "October 21, 2024",
      title: "Early Voting Begins",
      description: "Polling places open for early in-person voting.",
      icon: CalendarDays,
      status: "current"
    },
    {
      date: "October 29, 2024",
      title: "Mail-in Ballot Request Deadline",
      description: "Last day to request an absentee or mail-in ballot.",
      icon: Flag,
      status: "upcoming"
    },
    {
      date: "November 5, 2024",
      title: "Election Day",
      description: "Polls open 7:00 AM to 8:00 PM. Mail-in ballots must be postmarked by today.",
      icon: CheckCircle,
      status: "upcoming"
    }
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Election Timeline</h1>
        <p className="text-muted-foreground">
          Key dates and deadlines you need to know.
        </p>
      </div>

      <div className="relative border-l-2 border-primary/20 ml-4 md:ml-6 space-y-8 pb-4">
        {timelineEvents.map((event, index) => {
          const isCurrent = event.status === "current";
          const isPast = event.status === "past";
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.15 }}
              className="relative pl-8 md:pl-10"
            >
              <div 
                className={`absolute -left-[17px] mt-1.5 h-8 w-8 rounded-full border-4 border-background flex items-center justify-center
                  ${isPast ? "bg-muted text-muted-foreground" : isCurrent ? "bg-primary text-primary-foreground ring-4 ring-primary/20" : "bg-secondary text-secondary-foreground"}`}
              >
                <event.icon className="h-4 w-4" />
              </div>
              
              <Card className={`glass ${isCurrent ? "border-primary/50 shadow-md shadow-primary/5" : ""}`}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{event.title}</CardTitle>
                    <span className={`text-sm font-semibold px-2.5 py-0.5 rounded-full 
                      ${isPast ? "bg-muted text-muted-foreground" : isCurrent ? "bg-primary/10 text-primary" : "bg-secondary text-secondary-foreground"}`}>
                      {event.date}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{event.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
