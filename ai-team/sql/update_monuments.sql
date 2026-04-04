USE taroudant_heritage_shield;

-- Update monument names, locations, coordinates, and descriptions
-- based on IDs 1-13 as defined in the seeding logic.

UPDATE monuments SET 
  name = 'Bab Bizamaren',
  location = 'Entrée ouest de la médina',
  latitude = 30.4777844,
  longitude = -8.8827515,
  description = 'Une entrée historique de la médina, faisant partie des vastes remparts saadiens du XVIe siècle, reflétant le style de construction traditionnel en terre et en chaux de Taroudant.'
WHERE monument_id = 1;

UPDATE monuments SET 
  name = 'Bab Lkhemiss',
  location = 'Entrée nord de la médina',
  latitude = 30.4786022,
  longitude = -8.8753605,
  description = 'Positionnée sur le côté nord, cette porte est historiquement liée au marché traditionnel du jeudi (Souk el-Khemis) et à un cimetière pré-saadien.'
WHERE monument_id = 2;

UPDATE monuments SET 
  name = 'Bab Zorgane',
  location = 'Entrée sud-est de la médina',
  latitude = 30.4651157,
  longitude = -8.8763365,
  description = 'Située sur le côté sud, son nom fait référence à la présence historique de moulins (broyeurs). Elle reste un centre de transit vital pour la ville.'
WHERE monument_id = 3;

UPDATE monuments SET 
  name = 'Bab Sedra',
  location = 'Entrée sud-ouest de la médina',
  latitude = 30.4725314,
  longitude = -8.8747595,
  description = 'Étroitement liée aux fortifications de la Kasbah, elle reflète l\'ingénierie militaire du XVIe siècle avec ses murs épais et son positionnement stratégique.'
WHERE monument_id = 4;

UPDATE monuments SET 
  name = 'Bab El Kasbah',
  location = 'Accès à la Kasbah',
  latitude = 30.4719188,
  longitude = -8.8741711,
  description = 'La porte principale du quartier administratif de la Kasbah, qui abritait historiquement la résidence du sultan et les quartiers militaires.'
WHERE monument_id = 5;

UPDATE monuments SET 
  name = 'Bab Lblalia',
  location = 'Quartier sud de la médina',
  latitude = 30.4692058,
  longitude = -8.8727498,
  description = 'Une porte secondaire servant les quartiers résidentiels traditionnels, caractérisée par sa structure solide en pisé et ses murs défensifs.'
WHERE monument_id = 6;

UPDATE monuments SET 
  name = 'Bab Selsla',
  location = 'Entrée principale de la Kasbah',
  latitude = 30.4720004,
  longitude = -8.8739327,
  description = 'Traditionnellement l\'entrée royale, cette porte à triple arche est l\'une des entrées les plus majestueuses de la ville, souvent associée aux arrivées diplomatiques.'
WHERE monument_id = 7;

UPDATE monuments SET 
  name = 'Bab Lahjer',
  location = 'Quartier central est',
  latitude = 30.4751103,
  longitude = -8.8730579,
  description = 'Connue sous le nom de "Porte de Pierre", elle sert de point d\'entrée robuste dans les murs saadiens, préservant l\'esthétique des fortifications médiévales de la région du Souss.'
WHERE monument_id = 8;

UPDATE monuments SET 
  name = 'Bab Benyara',
  location = 'Entrée sud',
  latitude = 30.4651867,
  longitude = -8.8784939,
  description = 'Une porte stratégiquement située qui a évolué pour devenir un point majeur pour les transports modernes, reliant l\'ancienne médina aux routes régionales.'
WHERE monument_id = 9;

UPDATE monuments SET 
  name = 'Bab Derb Laafou',
  location = 'Nord de la médina',
  latitude = 30.4765235,
  longitude = -8.8735395,
  description = 'Une porte associée à l\'"Allee du Pardon", servant historiquement de point d\'entrée paisible vers le cœur spirituel de la ville.'
WHERE monument_id = 10;

UPDATE monuments SET 
  name = 'Bab Oulad Bounouna',
  location = 'Nord-ouest de la médina',
  latitude = 30.4727126,
  longitude = -8.8751742,
  description = 'Nommée d\'après les familles andalouses qui se sont installées à Taroudant au XVIe siècle, elle présente un design classique d\'"entrée coudée" défensive.'
WHERE monument_id = 11;

UPDATE monuments SET 
  name = 'Bab Agafay',
  location = 'Sud-ouest de la médina',
  latitude = 30.4727122,
  longitude = -8.8884867,
  description = 'Une porte périphérique offrant un accès aux jardins du sud et aux terres agricoles qui ont soutenu Taroudant pendant des siècles.'
WHERE monument_id = 12;

UPDATE monuments SET 
  name = 'Bab Tafelagt',
  location = 'Entrée nord-est',
  latitude = 30.4796025,
  longitude = -8.8777209,
  description = 'Un point d\'accès nord qui relie la ville aux routes menant vers les montagnes du Haut Atlas, essentiel pour le commerce et les caravanes de montagne.'
WHERE monument_id = 13;

-- Update category to 'Porte de ville' (ID 2) for all 13 gates
UPDATE monuments SET category_id = 2 WHERE monument_id BETWEEN 1 AND 13;
