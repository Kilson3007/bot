module.exports = { 
  apps : [{ 
    name   : "agente077", 
    script : "bot.js", 
    watch  : false, 
    max_memory_restart: "500M", 
    restart_delay: 5000, 
    env: { 
      NODE_ENV: "production" 
    } 
  }] 
} 
