// Fliki AI Integration - Video Script Formatter

import { clean, slug } from './config.js';

export class FlikiFormatter {
  constructor() {
    this.defaultSettings = {
      hookDuration: 3,
      mainContentDuration: 45,
      ctaDuration: 5,
      pauseDuration: 0.5
    };
  }

  formatForFliki(rewrittenStory, options = {}) {
    const {
      videoLength = 'short', // short (30s), medium (60s), long (120s)
      includeVisualCues = true,
      includeTimestamps = true,
      voiceStyle = 'energetic',
      language = 'Spanish'
    } = options;

    const { rewritten, style, title = '', keyFacts = {} } = rewrittenStory;
    
    // Create script structure based on video length
    const script = this.createScriptStructure(rewritten, videoLength, style);
    
    // Add visual cues if requested
    if (includeVisualCues) {
      script.visualCues = this.generateVisualCues(rewrittenStory, keyFacts);
    }
    
    // Add timing markers if requested
    if (includeTimestamps) {
      script.timing = this.generateTimingMarkers(script, videoLength);
    }
    
    // Generate hashtags and social media content
    const social = this.generateSocialContent(rewrittenStory, keyFacts);
    
    return {
      title: this.generateVideoTitle(title || rewritten.slice(0, 60)),
      script: script,
      social: social,
      flikiConfig: this.generateFlikiConfig(voiceStyle, language),
      metadata: {
        originalStyle: style,
        targetLength: videoLength,
        language: language,
        createdAt: new Date().toISOString()
      }
    };
  }

  createScriptStructure(content, videoLength, style) {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    let hook = "";
    let mainContent = "";
    let cta = "";
    
    // Extract hook (first impactful sentence)
    if (sentences.length > 0) {
      hook = sentences[0].trim();
      if (hook && !hook.match(/^(breaking|just in|update|here's what)/i)) {
        // Add urgency if not already present
        hook = this.addUrgencyToHook(hook, style);
      }
    }
    
    // Main content (middle sentences)
    if (sentences.length > 2) {
      mainContent = sentences.slice(1, -1).join('. ').trim();
    } else if (sentences.length === 2) {
      mainContent = sentences[1].trim();
    }
    
    // Call to action based on video length
    cta = this.generateCTA(videoLength, style);
    
    return {
      hook: {
        text: hook,
        duration: this.defaultSettings.hookDuration,
        notes: "Start with high energy to grab attention"
      },
      mainContent: {
        text: mainContent,
        duration: this.getMainContentDuration(videoLength),
        notes: "Maintain engagement, vary pace, add pauses for emphasis"
      },
      cta: {
        text: cta,
        duration: this.defaultSettings.ctaDuration,
        notes: "End with strong call to action"
      }
    };
  }

  addUrgencyToHook(hook, style) {
    const urgencyPrefixes = {
      breaking: "🚨 BREAKING: ",
      analysis: "📊 ANALYSIS: ",
      recap: "📺 RECAP: ",
      opinion: "💭 MI OPINIÓN: ",
      quick: "⚡ UPDATE: "
    };
    
    const prefix = urgencyPrefixes[style] || "🔥 ";
    return prefix + hook;
  }

  getMainContentDuration(videoLength) {
    const durations = {
      short: 22,   // 30s total - 3s hook - 5s CTA
      medium: 52,  // 60s total - 3s hook - 5s CTA  
      long: 112    // 120s total - 3s hook - 5s CTA
    };
    return durations[videoLength] || durations.short;
  }

  generateCTA(videoLength, style) {
    const ctas = {
      short: [
        "¡Dale like si te gustó esta noticia!",
        "¡Síguenos para más noticias deportivas!",
        "¡Comenta qué opinas de esto!"
      ],
      medium: [
        "Si quieres mantenerte al día con las últimas noticias deportivas, no olvides suscribirte y activar la campanita.",
        "¿Qué opinas de esta noticia? Déjanos tu comentario y no olvides darle like al video.",
        "Para más análisis deportivo como este, suscríbete al canal y síguenos en nuestras redes sociales."
      ],
      long: [
        "Eso es todo por hoy. Si te gustó este análisis, asegúrate de darle like al video y suscribirte al canal para no perderte ninguna noticia deportiva. También puedes seguirnos en nuestras redes sociales para contenido exclusivo.",
        "¿Estás de acuerdo con nuestro análisis? Déjanos saber en los comentarios qué piensas sobre esta situación. Y recuerda suscribirte para más contenido deportivo de calidad.",
        "Gracias por vernos. Si quieres que cubramos algún tema específico, déjanoslo en los comentarios. No olvides darle like, suscribirte y activar las notificaciones para estar al día con todas las noticias deportivas."
      ]
    };
    
    const ctaList = ctas[videoLength] || ctas.short;
    return ctaList[Math.floor(Math.random() * ctaList.length)];
  }

  generateVisualCues(story, keyFacts) {
    const cues = [];
    
    // Hook visuals
    cues.push({
      section: "hook",
      time: "0-3s",
      visual: "Breaking news graphic with urgent music",
      description: "Red/orange breaking news overlay with dramatic intro"
    });
    
    // Extract team/player names for relevant visuals
    if (keyFacts.names && keyFacts.names.length > 0) {
      const mainName = keyFacts.names[0];
      cues.push({
        section: "mainContent",
        time: "3-15s", 
        visual: `${mainName} footage/highlights`,
        description: `Show recent highlights or photos of ${mainName}`
      });
    }
    
    // Statistical overlays
    if (keyFacts.numbers && keyFacts.numbers.length > 0) {
      cues.push({
        section: "mainContent",
        time: "15-30s",
        visual: "Statistics overlay",
        description: `Display key numbers: ${keyFacts.numbers.slice(0, 3).join(', ')}`
      });
    }
    
    // Social media/reaction footage
    cues.push({
      section: "mainContent",
      time: "30-45s",
      visual: "Social media reactions or related footage",
      description: "Show Twitter reactions, press conference clips, or related action"
    });
    
    // CTA visuals
    cues.push({
      section: "cta",
      time: "45-50s",
      visual: "Subscribe animation and social media handles",
      description: "Show subscribe button animation, like/comment prompts"
    });
    
    return cues;
  }

  generateTimingMarkers(script, videoLength) {
    const totalDuration = this.getTotalDuration(videoLength);
    
    return {
      totalDuration: `${totalDuration}s`,
      sections: [
        {
          name: "hook",
          start: "00:00",
          end: "00:03",
          pacing: "fast",
          notes: "Grab attention immediately"
        },
        {
          name: "mainContent", 
          start: "00:03",
          end: `00:${totalDuration - 5}`,
          pacing: "moderate",
          notes: "Maintain engagement, add strategic pauses"
        },
        {
          name: "cta",
          start: `00:${totalDuration - 5}`,
          end: `00:${totalDuration}`,
          pacing: "moderate",
          notes: "Clear call to action"
        }
      ],
      pausePoints: this.generatePausePoints(script)
    };
  }

  generatePausePoints(script) {
    const points = [];
    
    // Add pause after hook for emphasis
    points.push({
      time: "00:03",
      duration: "0.5s",
      reason: "Emphasis after hook"
    });
    
    // Add pauses at natural sentence breaks in main content
    const sentences = script.mainContent.text.split(/[.!?]+/);
    if (sentences.length > 2) {
      points.push({
        time: "00:15",
        duration: "0.3s", 
        reason: "Natural sentence break"
      });
      
      points.push({
        time: "00:30",
        duration: "0.3s",
        reason: "Mid-content pause for emphasis"
      });
    }
    
    return points;
  }

  getTotalDuration(videoLength) {
    const durations = {
      short: 30,
      medium: 60,
      long: 120
    };
    return durations[videoLength] || 30;
  }

  generateSocialContent(story, keyFacts) {
    const { title, rewritten } = story;
    
    // Generate hashtags
    const hashtags = this.generateHashtags(keyFacts, story);
    
    // Create social media posts
    const twitter = this.createTwitterPost(title || rewritten.slice(0, 100), hashtags);
    const instagram = this.createInstagramCaption(title || rewritten.slice(0, 150), hashtags);
    const youtube = this.createYouTubeDescription(rewritten, hashtags);
    
    return {
      hashtags,
      twitter,
      instagram, 
      youtube
    };
  }

  generateHashtags(keyFacts, story) {
    const baseHashtags = ['#DeportesEnVivo', '#NoticiasDeportivas', '#WestSideCotorreo'];
    const customHashtags = [];
    
    // Add sport-specific hashtags based on content
    const sportKeywords = {
      '#NFL': ['nfl', 'football', 'americano'],
      '#NBA': ['nba', 'basketball', 'baloncesto'],
      '#MLB': ['mlb', 'baseball', 'beisbol'],
      '#Soccer': ['soccer', 'futbol', 'fútbol'],
      '#UFC': ['ufc', 'mma'],
      '#Boxing': ['boxing', 'boxeo'],
      '#Tennis': ['tennis', 'tenis']
    };
    
    const content = story.rewritten.toLowerCase();
    Object.entries(sportKeywords).forEach(([hashtag, keywords]) => {
      if (keywords.some(keyword => content.includes(keyword))) {
        customHashtags.push(hashtag);
      }
    });
    
    // Add name-based hashtags if major players involved
    if (keyFacts.names) {
      keyFacts.names.slice(0, 2).forEach(name => {
        const hashtag = `#${name.replace(/\s+/g, '')}`;
        if (hashtag.length <= 20) {
          customHashtags.push(hashtag);
        }
      });
    }
    
    return [...baseHashtags, ...customHashtags].slice(0, 8);
  }

  createTwitterPost(content, hashtags) {
    const maxLength = 280;
    const hashtagString = hashtags.slice(0, 3).join(' ');
    const availableLength = maxLength - hashtagString.length - 5; // 5 for spacing
    
    let tweet = content.slice(0, availableLength);
    if (content.length > availableLength) {
      tweet = tweet.slice(0, tweet.lastIndexOf(' ')) + '...';
    }
    
    return `${tweet}\n\n${hashtagString}`;
  }

  createInstagramCaption(content, hashtags) {
    return `${content}\n\n¡Síguenos para más noticias deportivas!\n\n${hashtags.join(' ')}`;
  }

  createYouTubeDescription(content, hashtags) {
    return `${content}

📺 Suscríbete para más contenido deportivo: [CHANNEL_URL]
🔔 Activa las notificaciones para no perderte nada
📱 Síguenos en redes sociales: [SOCIAL_LINKS]

${hashtags.join(' ')}

---
West Side Cotorreo - Tu fuente de noticias deportivas`;
  }

  generateFlikiConfig(voiceStyle, language) {
    const voiceSettings = {
      energetic: {
        speed: 1.1,
        pitch: 1.05,
        emphasis: 'strong'
      },
      calm: {
        speed: 0.95,
        pitch: 1.0,
        emphasis: 'moderate'
      },
      professional: {
        speed: 1.0,
        pitch: 0.98,
        emphasis: 'subtle'
      }
    };
    
    const settings = voiceSettings[voiceStyle] || voiceSettings.energetic;
    
    return {
      voice: {
        language: language === 'Spanish' ? 'es-ES' : 'en-US',
        style: voiceStyle,
        speed: settings.speed,
        pitch: settings.pitch,
        emphasis: settings.emphasis
      },
      music: {
        intro: 'dramatic-news-intro',
        background: 'subtle-news-background',
        outro: 'upbeat-subscribe-outro'
      },
      transitions: {
        fadeIn: 0.5,
        fadeOut: 0.5,
        crossfade: 0.3
      }
    };
  }

  generateVideoTitle(content) {
    // Create compelling YouTube title from content
    let title = content.slice(0, 60);
    
    // Ensure it ends at a word boundary
    if (content.length > 60) {
      title = title.slice(0, title.lastIndexOf(' '));
    }
    
    // Add urgency indicators if not present
    if (!title.match(/^(🚨|⚡|🔥|BREAKING|URGENT)/i)) {
      title = '🚨 ' + title;
    }
    
    // Ensure proper capitalization
    title = title.charAt(0).toUpperCase() + title.slice(1);
    
    return title;
  }
}

// Export singleton instance  
export const flikiFormatter = new FlikiFormatter();