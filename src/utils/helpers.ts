interface ProfileData {
  name: string;
  headline: string;
  location: string;
  summary: string;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: string[];
  recommendations: number;
}

interface ExperienceItem {
  title: string;
  company: string;
  duration: string;
}

interface EducationItem {
  school: string;
  degree: string;
  years: string;
}

interface ScoreResult {
  score: number;
  analysis: string;
}

export function calculateProfileScore(profile: ProfileData): ScoreResult {
  let score = 0;
  const analysisPoints: string[] = [];

  // Check experience
  if (profile.experience.length > 0) {
    // More experience is generally better
    score += Math.min(profile.experience.length * 5, 25);

    // Check for relevant job titles or companies (customize this for your needs)
    const relevantTitles = [
      "developer",
      "engineer",
      "programmer",
      "software",
      "web",
      "fullstack",
      "back-end",
      "front-end",
    ];
    const relevantCompanies = [
      "google",
      "microsoft",
      "amazon",
      "apple",
      "facebook",
      "meta",
      "netflix",
      "linkedin",
    ];

    let hasRelevantTitle = false;
    let hasTopCompany = false;

    profile.experience.forEach((exp) => {
      if (
        relevantTitles.some((title) => exp.title.toLowerCase().includes(title))
      ) {
        hasRelevantTitle = true;
      }

      if (
        relevantCompanies.some((company) =>
          exp.company.toLowerCase().includes(company)
        )
      ) {
        hasTopCompany = true;
      }
    });

    if (hasRelevantTitle) {
      score += 10;
      analysisPoints.push("Has relevant job titles in experience.");
    }

    if (hasTopCompany) {
      score += 15;
      analysisPoints.push("Has worked at top-tier tech companies.");
    }

    // Check for long-term positions
    const longTermPositions = profile.experience.filter((exp) => {
      const duration = exp.duration.toLowerCase();
      return (
        duration.includes("year") && !duration.includes("less than 1 year")
      );
    });

    if (longTermPositions.length > 0) {
      score += Math.min(longTermPositions.length * 5, 15);
      analysisPoints.push(
        `Has ${longTermPositions.length} long-term positions, showing stability.`
      );
    }
  } else {
    analysisPoints.push(
      "No work experience found. This is a significant concern."
    );
  }

  // Education assessment
  if (profile.education.length > 0) {
    score += Math.min(profile.education.length * 5, 10);

    // Check for prestigious schools
    const prestigiousSchools = [
      "stanford",
      "harvard",
      "mit",
      "princeton",
      "yale",
      "berkeley",
      "oxford",
      "cambridge",
    ];
    const hasPrestigiousSchool = profile.education.some((edu) =>
      prestigiousSchools.some((school) =>
        edu.school.toLowerCase().includes(school)
      )
    );

    if (hasPrestigiousSchool) {
      score += 10;
      analysisPoints.push(
        "Graduated from a prestigious educational institution."
      );
    }

    // Check for relevant degrees
    const relevantDegrees = [
      "computer science",
      "software",
      "engineering",
      "information technology",
      "data science",
    ];
    const hasRelevantDegree = profile.education.some((edu) =>
      relevantDegrees.some((degree) =>
        edu.degree.toLowerCase().includes(degree)
      )
    );

    if (hasRelevantDegree) {
      score += 10;
      analysisPoints.push("Has a relevant degree in a technical field.");
    }
  } else {
    analysisPoints.push("No formal education found.");
  }

  // Skills assessment
  if (profile.skills.length > 0) {
    score += Math.min(profile.skills.length, 20);

    // Check for relevant skills
    const relevantSkills = [
      "javascript",
      "typescript",
      "node.js",
      "react",
      "angular",
      "vue",
      "express",
      "mongodb",
      "sql",
      "python",
      "java",
      "c#",
      "php",
      "ruby",
      "go",
      "aws",
      "azure",
      "docker",
      "kubernetes",
    ];

    const matchingSkills = profile.skills.filter((skill) =>
      relevantSkills.some((rs) => skill.toLowerCase().includes(rs))
    );

    if (matchingSkills.length > 0) {
      score += Math.min(matchingSkills.length * 2, 20);
      analysisPoints.push(
        `Has ${matchingSkills.length} relevant technical skills.`
      );
    }
  } else {
    analysisPoints.push("No skills listed on profile.");
  }

  // Recommendations assessment
  if (profile.recommendations > 0) {
    score += Math.min(profile.recommendations * 2, 10);
    analysisPoints.push(
      `Has ${profile.recommendations} recommendations, indicating good professional relationships.`
    );
  }

  // Summary assessment
  if (profile.summary !== "No summary found" && profile.summary.length > 100) {
    score += 5;
    analysisPoints.push("Has a detailed professional summary.");
  }

  // Final analysis text
  let analysis = "";

  if (score >= 80) {
    analysis =
      "This candidate appears to be an excellent fit based on their LinkedIn profile. " +
      analysisPoints.join(" ");
  } else if (score >= 60) {
    analysis =
      "This candidate shows strong potential and would be worth interviewing. " +
      analysisPoints.join(" ");
  } else if (score >= 40) {
    analysis =
      "This candidate meets basic requirements but may need additional screening. " +
      analysisPoints.join(" ");
  } else {
    analysis =
      "This candidate does not appear to be a strong match based on their LinkedIn profile. " +
      analysisPoints.join(" ");
  }

  return {
    score,
    analysis,
  };
}
