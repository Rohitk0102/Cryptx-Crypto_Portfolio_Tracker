// Static content for the IT&CA Department website
// Updated with actual department data

export const departmentInfo = {
    name: "Information Technology & Computer Applications",
    university: "Andhra University",
    college: "A.U. College of Engineering (A)",
    tagline: "Engineering Tomorrow's Digital Infrastructure",
    established: "2018-19",
};

export const aboutContent = {
    paragraphs: [
        "The Department of IT & Computer Applications delivers industry-focused education across core computing domains—Artificial Intelligence, Data Systems, Cloud Architecture, and Cybersecurity. Our curriculum is designed in collaboration with industry leaders to ensure graduates are production-ready from day one.",
        "We emphasize hands-on learning through lab-intensive coursework, industry internships, and research projects. Our faculty bring decades of combined experience from both academia and the tech industry, ensuring students receive mentorship that bridges theoretical knowledge with practical application.",
        "Our alumni network spans Fortune 500 companies, cutting-edge startups, and leading research institutions. The department maintains active partnerships with major tech companies for placements, projects, and curriculum advisory.",
    ],
    focusAreas: [
        "Artificial Intelligence & Machine Learning",
        "Data Engineering & Analytics",
        "Cloud Native Architecture",
        "Cybersecurity & Network Systems",
        "Full-Stack Development",
        "Systems Programming",
    ],
};

// HOD data - successive heads of the department
export const hodList = [
    {
        id: 1,
        name: "Prof. S. Viziananda Row",
        designation: "Professor & Head of Department",
        tenure: "22-08-2019 to 28-11-2022",
        isCurrent: false,
    },
    {
        id: 2,
        name: "Prof. Kunjam Nageswara Rao",
        designation: "Professor & Head of Department (I/C)",
        tenure: "28-11-2022 to 2025",
        isCurrent: false,
    },
    {
        id: 3,
        name: "Prof. D Lalitha Bhaskari",
        designation: "Professor & Head of Department",
        tenure: "Present",
        isCurrent: true,
    },
];

// Current HOD for quick reference
export const hodData = hodList.find(h => h.isCurrent) || hodList[hodList.length - 1];

export const coursesData = {
    undergraduate: [
        {
            id: 1,
            name: "B.Tech (Information Technology)",
            duration: "4 Years",
            highlights: [
                "Core programming and algorithms",
                "Database systems and cloud computing",
                "Industry internship program",
            ],
        },
    ],
    postgraduate: [
        {
            id: 2,
            name: "M.Tech (Information Technology)",
            duration: "2 Years",
            highlights: [
                "Advanced computing systems",
                "Specialization in emerging technologies",
                "Research-oriented dissertation",
            ],
        },
        {
            id: 3,
            name: "M.C.A (Master of Computer Applications)",
            duration: "2 Years",
            highlights: [
                "Enterprise application development",
                "Software engineering practices",
                "Industry collaboration projects",
            ],
        },
        {
            id: 4,
            name: "M.Sc (Computer Science)",
            duration: "2 Years",
            highlights: [
                "Theoretical computer science",
                "Research methodologies",
                "Advanced algorithms",
            ],
        },
    ],
    research: [
        {
            id: 5,
            name: "Ph.D. (Faculty of Engineering)",
            duration: "3-5 Years",
            highlights: [
                "Original research contribution",
                "Publication in peer-reviewed journals",
                "Engineering applications focus",
            ],
        },
        {
            id: 6,
            name: "Ph.D. (Faculty of Science)",
            duration: "3-5 Years",
            highlights: [
                "Fundamental research",
                "Cross-disciplinary studies",
                "Scientific computing focus",
            ],
        },
    ],
};

export const eventsData = [
    {
        id: 1,
        name: "Build Bharat through AI Hackathon",
        type: "Hackathon",
        date: "April 17, 2025",
        objective: "24-hour national level hackathon on building innovative projects using AI with 550+ participants",
    },
];

export const navLinks = [
    { id: "about", label: "About" },
    { id: "hod", label: "HOD" },
    { id: "courses", label: "Courses" },
    { id: "events", label: "Events" },
];
