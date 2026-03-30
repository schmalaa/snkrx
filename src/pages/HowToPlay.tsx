import React from 'react';
import { motion } from 'framer-motion';

export const HowToPlay = () => {
  return (
    <motion.div className="page-container z-100" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="page-content w-full flex-col items-center">
        <h2 className="title text-4xl mb-6">HOW TO PLAY</h2>
        <div className="text-left text-lg text-white" style={{ maxWidth: '800px', lineHeight: '1.8' }}>
          <p className="mb-4"><strong>1. Build Your Snake:</strong> Use gold in the Tavern to hire specialized heroes. Heroes have unique weapons and classes.</p>
          <p className="mb-4"><strong>2. Class Synergies:</strong> Hiring multiple heroes of the SAME class unlocks massive passive buffs (e.g. 3 Warriors gain +50% damage).</p>
          <p className="mb-4"><strong>3. Combat:</strong> Steer your snake using the mouse. Heroes automatically attack nearby enemies based on distance and cooldowns.</p>
          <p className="mb-4"><strong>4. Relics:</strong> Defeat the Elite Boss every 3 rounds to draft permanent passive Relic upgrades that alter your run!</p>
        </div>
      </div>
    </motion.div>
  );
};
