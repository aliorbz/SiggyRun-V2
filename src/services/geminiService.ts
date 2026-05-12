
export const getRitualMessage = async (score: number, status: 'WIN' | 'LOSS') => {
  const lossMessages = [
    "The shadows consume you... the ritual is lost.",
    "A failed incantation echoes in the void.",
    "The circle is broken, the familiar flees.",
    "Darkness claims the essence of your nine lives.",
    "The ritual was interrupted by a flicker of doubt.",
    "Your spirit fades as the purple flames flicker out.",
    "The ancient ones are displeased with this offering.",
    "Entropy claims the ritual circle. Try again, Familiar.",
    "The grimoire slams shut. Your journey ends in shadow.",
    "A shattered elixir, a shattered soul."
  ];

  const winMessages = [
    "The moon rises in your favor, keep running.",
    "The ritual ascends! Your power grows.",
    "The ancient spirits whisper secrets of speed.",
    "Celestial energy flows through your paws.",
    "The circle glows with a radiant, dark light.",
    "Your familiar spirit is becoming legend.",
    "The stars align for your dark crossing.",
    "Mana pulses in the ground beneath you.",
    "The prophecy unfolds with every leap.",
    "You are the chosen shadow of the night."
  ];

  const pool = status === 'LOSS' ? lossMessages : winMessages;
  const randomIndex = Math.floor(Math.random() * pool.length);
  
  // Return immediately to keep it snappy and local
  return pool[randomIndex];
};
