/**
 * Project Configuration
 *
 * To add a new project, simply add a new object to the PROJECTS array below.
 *
 * Example:
 * {
 *   id: "project-name",
 *   title: "Project Title",
 *   description: "Brief project description",
 *   image: "/placeholder-project.svg",
 *   liveUrl: "https://example.com",
 *   githubUrl: "https://github.com/your-repo", // optional
 * }
 */

export interface Project {
  id: string;
  title: string;
  description: string;
  image: string;
  liveUrl: string;
  githubUrl?: string;
}

export const PROJECTS: Project[] = [
  {
    id: "barbershop",
    title: "Barbershop Demo",
    description:
      "Modern booking system with service showcase and testimonials.",
    image: "/barber.PNG",
    liveUrl: "https://barber-demo.khawarizmi.space/",
  },
  {
    id: "cafe",
    title: "Café Demo",
    description:
      "Beautiful menu display with ambient design and online ordering.",
    image: "/cafe.PNG",
    liveUrl: "https://cafe-demo.khawarizmi.space/",
  },
  {
    id: "tuition",
    title: "Tuition Center Demo",
    description:
      "Educational platform with course listings and enrollment system.",
    image: "/tuition.PNG",
    liveUrl: "https://tuition-demo.khawarizmi.space/",
  },

  // ========================================
  // ADD YOUR NEW PROJECTS HERE
  // ========================================
  // {
  //   id: "my-new-project",
  //   title: "My New Project",
  //   description: "A brief description of your amazing project",
  //   image: "/placeholder-project.svg",
  //   liveUrl: "https://your-project-url.com",
  //   githubUrl: "https://github.com/your-username/repo-name", // optional
  // },
];
