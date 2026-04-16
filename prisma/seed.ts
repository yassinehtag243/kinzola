// ═══════════════════════════════════════════════════════════════
//  KINZOLA — Prisma Seed File
//  Populates SQLite database with all mock data
//  Run with: npx tsx prisma/seed.ts
// ═══════════════════════════════════════════════════════════════

import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  console.log('🗑️  Clearing existing data...');

  // Delete in correct FK order to avoid constraint violations
  await db.customNickname.deleteMany();
  await db.report.deleteMany();
  await db.block.deleteMany();
  await db.notification.deleteMany();
  await db.comment.deleteMany();
  await db.postLike.deleteMany();
  await db.message.deleteMany();
  await db.post.deleteMany();
  await db.story.deleteMany();
  await db.conversation.deleteMany();
  await db.match.deleteMany();
  await db.user.deleteMany();

  console.log('✅ Database cleared.\n');

  // ═══════════════════════════════════════════════════════════
  //  1. CREATE USERS
  // ═══════════════════════════════════════════════════════════
  console.log('👥 Creating users...');

  // Current user — Grace Mbuyi
  const grace = await db.user.create({
    data: {
      id: 'user-me',
      email: 'grace@example.com',
      passwordHash: 'kinzola2024',
      pseudo: 'Gracia_26',
      name: 'Grace Mbuyi',
      age: 26,
      gender: 'femme',
      city: 'Kinshasa',
      profession: 'Développeuse Web',
      religion: 'Chrétienne',
      bio: 'Passionnée par la technologie et la musique. Je cherche une relation sérieuse basée sur la confiance et le respect mutuel. 🌟',
      photoUrl: 'https://i.pravatar.cc/300?img=44',
      photoGallery: JSON.stringify([
        'https://i.pravatar.cc/300?img=44',
        'https://i.pravatar.cc/300?img=45',
        'https://i.pravatar.cc/300?img=46',
        'https://i.pravatar.cc/300?img=47',
      ]),
      verified: true,
      interests: JSON.stringify(['Technologie', 'Musique', 'Lecture', 'Voyage', 'Cuisine']),
      online: true,
      createdAt: new Date('2024-01-15T10:00:00Z'),
    },
  });

  // 15 other profiles from mock data
  const profiles = [
    {
      id: 'user-1', name: 'Patrick Lumumba', age: 28, gender: 'homme', city: 'Kinshasa',
      profession: 'Ingénieur Civil', religion: 'Chrétien',
      bio: "Ingénieur passionné, j'aime construire et innover. Cherche une partenaire sérieuse pour partager la vie.",
      photoUrl: 'https://i.pravatar.cc/300?img=32',
      photoGallery: ['https://i.pravatar.cc/300?img=32', 'https://i.pravatar.cc/300?img=33'],
      verified: true, interests: ['Architecture', 'Sport', 'Cinéma', 'Voyage'], online: true,
      lastSeen: new Date().toISOString(),
    },
    {
      id: 'user-2', name: 'Divine Kabongo', age: 24, gender: 'femme', city: 'Lubumbashi',
      profession: 'Médecin', religion: 'Chrétienne',
      bio: "Médecin généraliste, je crois en l'amour vrai et durable. La santé du corps et du cœur sont importantes.",
      photoUrl: 'https://i.pravatar.cc/300?img=68',
      photoGallery: ['https://i.pravatar.cc/300?img=68', 'https://i.pravatar.cc/300?img=69'],
      verified: true, interests: ['Médecine', 'Lecture', 'Natation', 'Bénévolat'], online: false,
      lastSeen: '2024-12-20T14:30:00Z',
    },
    {
      id: 'user-3', name: 'Benjamin Nsamba', age: 30, gender: 'homme', city: 'Kinshasa',
      profession: 'Entrepreneur', religion: 'Chrétien',
      bio: "Fondateur d'une startup tech à Kinshasa. Ambitieux mais grounded. Je valorise la famille et la foi.",
      photoUrl: 'https://i.pravatar.cc/300?img=75',
      photoGallery: ['https://i.pravatar.cc/300?img=75', 'https://i.pravatar.cc/300?img=76'],
      verified: true, interests: ['Business', 'Tech', 'Football', 'Cuisine'], online: true,
      lastSeen: new Date().toISOString(),
    },
    {
      id: 'user-4', name: 'Esther Tshibangu', age: 22, gender: 'femme', city: 'Goma',
      profession: 'Étudiante en Droit', religion: 'Chrétienne',
      bio: 'Future avocate, je défends ce en quoi je crois. Cherche un homme ambitieux et respectueux.',
      photoUrl: 'https://i.pravatar.cc/300?img=17',
      photoGallery: ['https://i.pravatar.cc/300?img=17', 'https://i.pravatar.cc/300?img=18'],
      verified: false, interests: ['Droit', 'Débat', 'Lecture', 'Musique'], online: false,
      lastSeen: '2024-12-19T09:00:00Z',
    },
    {
      id: 'user-5', name: 'Joel Mwamba', age: 27, gender: 'homme', city: 'Kinshasa',
      profession: 'Photographe', religion: 'Chrétien',
      bio: "Je capture les moments les plus beaux de la vie. À la recherche de quelqu'un avec qui créer de bons souvenirs.",
      photoUrl: 'https://i.pravatar.cc/300?img=51',
      photoGallery: ['https://i.pravatar.cc/300?img=51', 'https://i.pravatar.cc/300?img=52'],
      verified: true, interests: ['Photographie', 'Art', 'Nature', 'Voyage'], online: true,
      lastSeen: new Date().toISOString(),
    },
    {
      id: 'user-6', name: 'Naomie Kapinga', age: 25, gender: 'femme', city: 'Kinshasa',
      profession: 'Journaliste', religion: 'Chrétienne',
      bio: "Journaliste freelance, je suis curieuse de nature et j'adore découvrir de nouvelles cultures.",
      photoUrl: 'https://i.pravatar.cc/300?img=25',
      photoGallery: ['https://i.pravatar.cc/300?img=25', 'https://i.pravatar.cc/300?img=26'],
      verified: true, interests: ['Écriture', 'Voyage', 'Politique', 'Café'], online: false,
      lastSeen: '2024-12-21T18:45:00Z',
    },
    {
      id: 'user-7', name: 'David Kalala', age: 32, gender: 'homme', city: 'Lubumbashi',
      profession: 'Comptable', religion: 'Musulman',
      bio: 'Père de famille moderne, je cherche une relation stable et épanouissante. Sérieux et attentionné.',
      photoUrl: 'https://i.pravatar.cc/300?img=22',
      photoGallery: ['https://i.pravatar.cc/300?img=22', 'https://i.pravatar.cc/300?img=23'],
      verified: true, interests: ['Finance', 'Football', 'Cuisine', 'Famille'], online: true,
      lastSeen: new Date().toISOString(),
    },
    {
      id: 'user-8', name: 'Christelle Mbala', age: 23, gender: 'femme', city: 'Kinshasa',
      profession: 'Styliste', religion: 'Chrétienne',
      bio: "Créatrice de mode, je transforme les tissus en art. Cherche l'âme sœur qui apprecie la beauté dans les petites choses.",
      photoUrl: 'https://i.pravatar.cc/300?img=38',
      photoGallery: ['https://i.pravatar.cc/300?img=38', 'https://i.pravatar.cc/300?img=39'],
      verified: false, interests: ['Mode', 'Design', 'Danse', 'Shopping'], online: true,
      lastSeen: new Date().toISOString(),
    },
    {
      id: 'user-9', name: 'Hervé Ilunga', age: 29, gender: 'homme', city: 'Goma',
      profession: 'Professeur', religion: 'Chrétien',
      bio: "Enseignant d'anglais, je croix en l'éducation comme outil de changement. Homme de principes et de valeurs.",
      photoUrl: 'https://i.pravatar.cc/300?img=55',
      photoGallery: ['https://i.pravatar.cc/300?img=55', 'https://i.pravatar.cc/300?img=56'],
      verified: true, interests: ['Éducation', 'Langues', 'Lecture', 'Randonnée'], online: false,
      lastSeen: '2024-12-20T11:00:00Z',
    },
    {
      id: 'user-10', name: 'Ruth Nyota', age: 26, gender: 'femme', city: 'Kinshasa',
      profession: 'Chanteuse', religion: 'Chrétienne',
      bio: 'Gospel singer et compositrice. La musique est ma passion, mais l\'amour est ma priorité. 🎵',
      photoUrl: 'https://i.pravatar.cc/300?img=55',
      photoGallery: ['https://i.pravatar.cc/300?img=55', 'https://i.pravatar.cc/300?img=56'],
      verified: true, interests: ['Musique', 'Église', 'Chant', 'Piano'], online: true,
      lastSeen: new Date().toISOString(),
    },
    {
      id: 'user-11', name: 'Emmanuel Kashala', age: 35, gender: 'homme', city: 'Kinshasa',
      profession: 'Avocat', religion: 'Chrétien',
      bio: 'Avocat au barreau de Kinshasa. La justice et la famille sont mes valeurs fondamentales.',
      photoUrl: 'https://i.pravatar.cc/300?img=60',
      photoGallery: ['https://i.pravatar.cc/300?img=60', 'https://i.pravatar.cc/300?img=61'],
      verified: true, interests: ['Droit', 'Politique', 'Lecture', 'Golf'], online: false,
      lastSeen: '2024-12-21T20:00:00Z',
    },
    {
      id: 'user-12', name: 'Samantha Ilunga', age: 21, gender: 'femme', city: 'Mbuji-Mayi',
      profession: 'Étudiante en Informatique', religion: 'Chrétienne',
      bio: "Future développeuse full-stack. Passionnée par l'innovation technologique et les chats 🐱",
      photoUrl: 'https://i.pravatar.cc/300?img=5',
      photoGallery: ['https://i.pravatar.cc/300?img=5', 'https://i.pravatar.cc/300?img=6'],
      verified: false, interests: ['Programmation', 'Jeux vidéo', 'Café', 'Cinéma'], online: true,
      lastSeen: new Date().toISOString(),
    },
    {
      id: 'user-13', name: 'Fabrice Mulumba', age: 26, gender: 'homme', city: 'Kinshasa',
      profession: 'Chef Cuisinier', religion: 'Musulman',
      bio: "Chef dans un restaurant 5 étoiles. La cuisine est mon art, et je cherche quelqu'un à qui cuisiner pour la vie.",
      photoUrl: 'https://i.pravatar.cc/300?img=84',
      photoGallery: ['https://i.pravatar.cc/300?img=84', 'https://i.pravatar.cc/300?img=85'],
      verified: true, interests: ['Cuisine', 'Voyage', 'Musique', 'Photographie'], online: true,
      lastSeen: new Date().toISOString(),
    },
    {
      id: 'user-14', name: 'Patience Lushima', age: 28, gender: 'femme', city: 'Kinshasa',
      profession: 'Pharmacienne', religion: 'Chrétienne',
      bio: 'Pharmacienne diplômée, je prends soin de la santé des autres. Il est temps de prendre soin de mon cœur. 💊❤️',
      photoUrl: 'https://i.pravatar.cc/300?img=33',
      photoGallery: ['https://i.pravatar.cc/300?img=33', 'https://i.pravatar.cc/300?img=34'],
      verified: true, interests: ['Santé', 'Yoga', 'Lecture', 'Nature'], online: false,
      lastSeen: '2024-12-21T16:30:00Z',
    },
    {
      id: 'user-15', name: 'Glody Mpiana', age: 31, gender: 'homme', city: 'Lubumbashi',
      profession: 'Musicien', religion: 'Chrétien',
      bio: 'Guitariste et chanteur. La musique rapproche les cœurs. Cherche une mélodie pour ma vie.',
      photoUrl: 'https://i.pravatar.cc/300?img=41',
      photoGallery: ['https://i.pravatar.cc/300?img=41', 'https://i.pravatar.cc/300?img=42'],
      verified: false, interests: ['Musique', 'Guitare', 'Danse', 'Voyage'], online: true,
      lastSeen: new Date().toISOString(),
    },
  ];

  const createdUsers = await db.$transaction(
    profiles.map((p) =>
      db.user.create({
        data: {
          id: p.id,
          email: `${p.name.toLowerCase().split(' ')[0].replace(/[^a-z]/g, '')}@kinzola.com`,
          pseudo: `${p.name.split(' ')[0]}_${p.age}`,
          name: p.name,
          age: p.age,
          gender: p.gender,
          city: p.city,
          profession: p.profession,
          religion: p.religion,
          bio: p.bio,
          photoUrl: p.photoUrl,
          photoGallery: JSON.stringify(p.photoGallery),
          verified: p.verified,
          interests: JSON.stringify(p.interests),
          online: p.online,
          lastSeen: new Date(p.lastSeen),
        },
      })
    )
  );

  const totalUsers = 1 + createdUsers.length;
  console.log(`   ✅ Created ${totalUsers} users (1 current + ${createdUsers.length} profiles)\n`);

  // ═══════════════════════════════════════════════════════════
  //  2. CREATE MATCHES
  // ═══════════════════════════════════════════════════════════
  console.log('💕 Creating matches...');

  const matchesData = [
    { id: 'match-1', user1Id: 'user-me', user2Id: 'user-1', isSuperMatch: false, newMatch: false, createdAt: new Date('2024-12-20T10:00:00Z') },
    { id: 'match-2', user1Id: 'user-me', user2Id: 'user-3', isSuperMatch: false, newMatch: false, createdAt: new Date('2024-12-20T14:00:00Z') },
    { id: 'match-3', user1Id: 'user-me', user2Id: 'user-5', isSuperMatch: false, newMatch: false, createdAt: new Date('2024-12-19T16:00:00Z') },
    { id: 'match-4', user1Id: 'user-me', user2Id: 'user-10', isSuperMatch: false, newMatch: true, createdAt: new Date('2024-12-21T08:00:00Z') },
    { id: 'match-5', user1Id: 'user-me', user2Id: 'user-12', isSuperMatch: false, newMatch: true, createdAt: new Date('2024-12-21T09:00:00Z') },
  ];

  const createdMatches = await db.$transaction(
    matchesData.map((m) =>
      db.match.create({
        data: {
          id: m.id,
          user1Id: m.user1Id,
          user2Id: m.user2Id,
          isSuperMatch: m.isSuperMatch,
          newMatch: m.newMatch,
          createdAt: m.createdAt,
        },
      })
    )
  );

  console.log(`   ✅ Created ${createdMatches.length} matches\n`);

  // ═══════════════════════════════════════════════════════════
  //  3. CREATE CONVERSATIONS
  // ═══════════════════════════════════════════════════════════
  console.log('💬 Creating conversations...');

  // Conversations exist for match-1 through match-4 (match-5 has no messages yet)
  const conversationsData = [
    {
      id: 'conv-1', matchId: 'match-1', participant1Id: 'user-me', participant2Id: 'user-1',
      lastMessage: "Ah super ! On a quelque chose en commun alors. Le monde de la tech est fascinant !",
      lastMessageTime: new Date('2024-12-21T10:20:00Z'),
      participant1Unread: 1, participant2Unread: 0,
      createdAt: new Date('2024-12-20T10:00:00Z'),
    },
    {
      id: 'conv-2', matchId: 'match-2', participant1Id: 'user-me', participant2Id: 'user-3',
      lastMessage: "Bien sûr ! Je connais un endroit incroyable à Gombe. On pourrait y aller ensemble un de ces jours 😄",
      lastMessageTime: new Date('2024-12-20T16:00:00Z'),
      participant1Unread: 0, participant2Unread: 0,
      createdAt: new Date('2024-12-20T14:00:00Z'),
    },
    {
      id: 'conv-3', matchId: 'match-3', participant1Id: 'user-me', participant2Id: 'user-5',
      lastMessage: "Merci Joel ! Oui j'aime beaucoup prendre des photos surtout en voyage.",
      lastMessageTime: new Date('2024-12-19T12:30:00Z'),
      participant1Unread: 0, participant2Unread: 0,
      createdAt: new Date('2024-12-19T16:00:00Z'),
    },
    {
      id: 'conv-4', matchId: 'match-4', participant1Id: 'user-me', participant2Id: 'user-10',
      lastMessage: 'Tu es chrétienne aussi non ? ❤️',
      lastMessageTime: new Date('2024-12-21T08:10:00Z'),
      participant1Unread: 3, participant2Unread: 0,
      createdAt: new Date('2024-12-21T08:00:00Z'),
    },
  ];

  const createdConversations = await db.$transaction(
    conversationsData.map((c) =>
      db.conversation.create({
        data: {
          id: c.id,
          matchId: c.matchId,
          participant1Id: c.participant1Id,
          participant2Id: c.participant2Id,
          lastMessage: c.lastMessage,
          lastMessageTime: c.lastMessageTime,
          participant1Unread: c.participant1Unread,
          participant2Unread: c.participant2Unread,
          createdAt: c.createdAt,
        },
      })
    )
  );

  console.log(`   ✅ Created ${createdConversations.length} conversations\n`);

  // ═══════════════════════════════════════════════════════════
  //  4. CREATE MESSAGES
  // ═══════════════════════════════════════════════════════════
  console.log('📨 Creating messages...');

  // Map conversation ID → conversation for quick lookup
  const convMap = new Map(conversationsData.map((c) => [c.id, c]));

  const messagesData = [
    // Conv 1: Grace ↔ Patrick
    { id: 'msg-1', conversationId: 'conv-1', senderId: 'user-1', content: "Bonjour Grace ! Comment vas-tu aujourd'hui ? 😊", type: 'text', read: true, createdAt: new Date('2024-12-21T10:00:00Z') },
    { id: 'msg-2', conversationId: 'conv-1', senderId: 'user-me', content: 'Salut Patrick ! Je vais très bien merci. Et toi ?', type: 'text', read: true, createdAt: new Date('2024-12-21T10:05:00Z') },
    { id: 'msg-3', conversationId: 'conv-1', senderId: 'user-1', content: "Très bien aussi ! Tu as un profil intéressant. Qu'est-ce que tu fais dans la vie ?", type: 'text', read: true, createdAt: new Date('2024-12-21T10:10:00Z') },
    { id: 'msg-4', conversationId: 'conv-1', senderId: 'user-me', content: "Je suis développeuse web. J'adore créer des applications et des sites internet !", type: 'text', read: true, createdAt: new Date('2024-12-21T10:15:00Z') },
    { id: 'msg-5', conversationId: 'conv-1', senderId: 'user-1', content: "Ah super ! On a quelque chose en commun alors. Le monde de la tech est fascinant !", type: 'text', read: false, createdAt: new Date('2024-12-21T10:20:00Z') },
    // Conv 2: Grace ↔ Benjamin
    { id: 'msg-6', conversationId: 'conv-2', senderId: 'user-3', content: "Hey ! J'ai vu qu'on aime tous les deux la cuisine. Tu es Kinshasienne ?", type: 'text', read: true, createdAt: new Date('2024-12-20T15:00:00Z') },
    { id: 'msg-7', conversationId: 'conv-2', senderId: 'user-me', content: 'Oui ! Originaire de Kinshasa. Tu connais un bon restaurant dans la ville ?', type: 'text', read: true, createdAt: new Date('2024-12-20T15:30:00Z') },
    { id: 'msg-8', conversationId: 'conv-2', senderId: 'user-3', content: "Bien sûr ! Je connais un endroit incroyable à Gombe. On pourrait y aller ensemble un de ces jours 😄", type: 'text', read: true, createdAt: new Date('2024-12-20T16:00:00Z') },
    // Conv 3: Grace ↔ Joel
    { id: 'msg-9', conversationId: 'conv-3', senderId: 'user-5', content: "Salut Grace, j'adore ta galerie photo ! Tu aimes la photographie ?", type: 'text', read: true, createdAt: new Date('2024-12-19T12:00:00Z') },
    { id: 'msg-10', conversationId: 'conv-3', senderId: 'user-me', content: "Merci Joel ! Oui j'aime beaucoup prendre des photos surtout en voyage.", type: 'text', read: true, createdAt: new Date('2024-12-19T12:30:00Z') },
    // Conv 4: Grace ↔ Ruth
    { id: 'msg-11', conversationId: 'conv-4', senderId: 'user-10', content: 'Hello Grace ! 🎵 Tu aimes la musique gospel ?', type: 'text', read: false, createdAt: new Date('2024-12-21T08:00:00Z') },
    { id: 'msg-12', conversationId: 'conv-4', senderId: 'user-10', content: "Je chante à l'église chaque dimanche. Peut-être qu'on se croise un jour !", type: 'text', read: false, createdAt: new Date('2024-12-21T08:05:00Z') },
    { id: 'msg-13', conversationId: 'conv-4', senderId: 'user-10', content: 'Tu es chrétienne aussi non ? ❤️', type: 'text', read: false, createdAt: new Date('2024-12-21T08:10:00Z') },
  ];

  const createdMessages = await db.$transaction(
    messagesData.map((m) =>
      db.message.create({
        data: {
          id: m.id,
          conversationId: m.conversationId,
          senderId: m.senderId,
          content: m.content,
          type: m.type,
          read: m.read,
          createdAt: m.createdAt,
        },
      })
    )
  );

  console.log(`   ✅ Created ${createdMessages.length} messages\n`);

  // ═══════════════════════════════════════════════════════════
  //  5. CREATE POSTS
  // ═══════════════════════════════════════════════════════════
  console.log('📝 Creating posts...');

  const postsData = [
    {
      id: 'post-1', authorId: 'user-1',
      content: "Premier jour sur Kinzola ! Je cherche une relation sérieuse et durable. Si tu es quelqu'un de passionné et ambitieux, n'hésite pas à me contacter. 🙏",
      imageUrl: 'https://picsum.photos/seed/drc1/1200/800', views: 234, likes: 45, visibility: 'public',
      expiresAt: new Date('2024-12-23T10:00:00Z'), createdAt: new Date('2024-12-21T10:00:00Z'),
    },
    {
      id: 'post-2', authorId: 'user-6',
      content: "Un café, un livre, et la paix du matin ☕📚 C'est les petites choses qui font le bonheur. Quel est votre livre préféré ?",
      imageUrl: null, views: 156, likes: 32, visibility: 'public',
      expiresAt: new Date('2024-12-23T08:00:00Z'), createdAt: new Date('2024-12-21T08:00:00Z'),
    },
    {
      id: 'post-3', authorId: 'user-10',
      content: "Dimanche de louange extraordinaire à ma paroisse ! 🎵✨ La musique touche toujours mon cœur. Que Dieu vous bénisse tous !",
      imageUrl: 'https://picsum.photos/seed/church1/1200/800', views: 312, likes: 89, visibility: 'friends',
      expiresAt: new Date('2024-12-22T12:00:00Z'), createdAt: new Date('2024-12-21T12:00:00Z'),
    },
    {
      id: 'post-4', authorId: 'user-13',
      content: "Nouveau plat créé aujourd'hui : Poulet moambé réinventé avec une touche moderne ! 🍗✨ La cuisine congolaise a tant à offrir au monde.",
      imageUrl: 'https://picsum.photos/seed/food1/1200/800', views: 445, likes: 112, visibility: 'public',
      expiresAt: new Date('2024-12-22T11:00:00Z'), createdAt: new Date('2024-12-21T11:00:00Z'),
    },
    {
      id: 'post-5', authorId: 'user-4',
      content: 'La justice est un droit fondamental. En tant que future avocate, je me bats chaque jour pour que les voix de chacun soient entendues. ⚖️',
      imageUrl: null, views: 198, likes: 67, visibility: 'friends',
      expiresAt: new Date('2024-12-23T09:30:00Z'), createdAt: new Date('2024-12-21T09:30:00Z'),
    },
  ];

  const createdPosts = await db.$transaction(
    postsData.map((p) =>
      db.post.create({
        data: {
          id: p.id,
          authorId: p.authorId,
          content: p.content,
          imageUrl: p.imageUrl,
          views: p.views,
          likes: p.likes,
          visibility: p.visibility,
          expiresAt: p.expiresAt,
          createdAt: p.createdAt,
        },
      })
    )
  );

  console.log(`   ✅ Created ${createdPosts.length} posts\n`);

  // ═══════════════════════════════════════════════════════════
  //  5b. CREATE COMMENTS on posts
  // ═══════════════════════════════════════════════════════════
  console.log('💬 Creating comments...');

  const commentsData = [
    { id: 'c1', postId: 'post-1', authorId: 'user-3', content: 'Bienvenue Patrick ! 🎉', createdAt: new Date('2024-12-21T11:00:00Z') },
    { id: 'c2', postId: 'post-1', authorId: 'user-5', content: 'Bon courage mon frère !', createdAt: new Date('2024-12-21T11:30:00Z') },
    { id: 'c3', postId: 'post-2', authorId: 'user-8', content: 'Moi c\'est "Le Petit Prince" ! ❤️', createdAt: new Date('2024-12-21T09:00:00Z') },
    { id: 'c4', postId: 'post-4', authorId: 'user-1', content: "Ça a l'air délicieux ! On peut goûter ? 😋", createdAt: new Date('2024-12-21T13:00:00Z') },
    { id: 'c5', postId: 'post-4', authorId: 'user-3', content: "Le moambé c'est le plat national ! 🔥", createdAt: new Date('2024-12-21T13:15:00Z') },
    { id: 'c6', postId: 'post-5', authorId: 'user-11', content: 'Tu me rappelles mes débuts au barreau ! Courage !', createdAt: new Date('2024-12-21T14:00:00Z') },
  ];

  const createdComments = await db.$transaction(
    commentsData.map((c) =>
      db.comment.create({
        data: {
          id: c.id,
          postId: c.postId,
          authorId: c.authorId,
          content: c.content,
          createdAt: c.createdAt,
        },
      })
    )
  );

  console.log(`   ✅ Created ${createdComments.length} comments\n`);

  // ═══════════════════════════════════════════════════════════
  //  6. CREATE STORIES
  // ═══════════════════════════════════════════════════════════
  console.log('📖 Creating stories...');

  const storiesData = [
    {
      id: 'story-1', authorId: 'user-1',
      imageUrl: 'https://picsum.photos/seed/story1/800/1400', content: '',
      type: 'photo', views: 89, likes: 23,
      expiresAt: new Date('2024-12-22T09:00:00Z'), createdAt: new Date('2024-12-21T09:00:00Z'),
    },
    {
      id: 'story-2', authorId: 'user-10',
      imageUrl: null, content: 'En studio pour un nouveau titre ! 🎤',
      type: 'text', views: 156, likes: 45,
      expiresAt: new Date('2024-12-23T11:00:00Z'), createdAt: new Date('2024-12-21T11:00:00Z'),
    },
    {
      id: 'story-3', authorId: 'user-13',
      imageUrl: 'https://picsum.photos/seed/story3/800/1400', content: '',
      type: 'photo', views: 200, likes: 67,
      expiresAt: new Date('2024-12-22T07:00:00Z'), createdAt: new Date('2024-12-21T07:00:00Z'),
    },
    {
      id: 'story-4', authorId: 'user-6',
      imageUrl: null, content: 'Le lever du soleil sur Kinshasa est magique 🌅',
      type: 'text', views: 134, likes: 38,
      expiresAt: new Date('2024-12-23T06:00:00Z'), createdAt: new Date('2024-12-21T06:00:00Z'),
    },
    {
      id: 'story-5', authorId: 'user-8',
      imageUrl: 'https://picsum.photos/seed/story5/800/1400', content: '',
      type: 'photo', views: 98, likes: 29,
      expiresAt: new Date('2024-12-22T08:00:00Z'), createdAt: new Date('2024-12-21T08:00:00Z'),
    },
  ];

  const createdStories = await db.$transaction(
    storiesData.map((s) =>
      db.story.create({
        data: {
          id: s.id,
          authorId: s.authorId,
          imageUrl: s.imageUrl,
          content: s.content,
          type: s.type,
          views: s.views,
          likes: s.likes,
          expiresAt: s.expiresAt,
          createdAt: s.createdAt,
        },
      })
    )
  );

  console.log(`   ✅ Created ${createdStories.length} stories\n`);

  // ═══════════════════════════════════════════════════════════
  //  7. CREATE NOTIFICATIONS
  // ═══════════════════════════════════════════════════════════
  console.log('🔔 Creating notifications...');

  const now = Date.now();
  const notificationsData = [
    {
      id: 'notif-1', userId: 'user-me', fromUserId: 'user-1',
      type: 'like', title: "Nouveau j'aime",
      message: 'Patrick Lumumba a aimé votre publication "Premier jour sur Kinzola !"',
      read: false, createdAt: new Date(now - 5 * 60 * 1000),
    },
    {
      id: 'notif-2', userId: 'user-me', fromUserId: 'user-3',
      type: 'comment_mention', title: 'Mention dans un commentaire',
      message: 'Benjamin Nsamba vous a mentionné dans un commentaire : "@Grace Mbuyi tu devrais voir ça !"',
      read: false, createdAt: new Date(now - 15 * 60 * 1000),
    },
    {
      id: 'notif-3', userId: 'user-me', fromUserId: null,
      type: 'badge_obtained', title: 'Badge officiel obtenu 🎉',
      message: 'Félicitations ! Votre badge officiel a été approuvé. Votre profil est maintenant vérifié.',
      read: false, createdAt: new Date(now - 1 * 60 * 60 * 1000),
    },
    {
      id: 'notif-4', userId: 'user-me', fromUserId: 'user-10',
      type: 'match', title: 'Nouveau match !',
      message: 'Vous avez matché avec Ruth Nyota. Commencez une conversation !',
      read: true, createdAt: new Date(now - 3 * 60 * 60 * 1000),
    },
    {
      id: 'notif-5', userId: 'user-me', fromUserId: 'user-6',
      type: 'mention', title: 'Vous avez été mentionné(e)',
      message: 'Naomie Kapinga a mentionné votre nom dans sa publication.',
      read: true, createdAt: new Date(now - 5 * 60 * 60 * 1000),
    },
    {
      id: 'notif-6', userId: 'user-me', fromUserId: 'user-5',
      type: 'like', title: "Nouveau j'aime",
      message: 'Joel Mwamba a aimé votre publication récente.',
      read: true, createdAt: new Date(now - 8 * 60 * 60 * 1000),
    },
    {
      id: 'notif-7', userId: 'user-me', fromUserId: 'user-13',
      type: 'comment_mention', title: 'Réponse à votre commentaire',
      message: 'Fabrice Mulumba a répondu à votre commentaire sur sa publication.',
      read: true, createdAt: new Date(now - 12 * 60 * 60 * 1000),
    },
  ];

  const createdNotifications = await db.$transaction(
    notificationsData.map((n) =>
      db.notification.create({
        data: {
          id: n.id,
          userId: n.userId,
          fromUserId: n.fromUserId,
          type: n.type,
          title: n.title,
          message: n.message,
          read: n.read,
          createdAt: n.createdAt,
        },
      })
    )
  );

  console.log(`   ✅ Created ${createdNotifications.length} notifications\n`);

  // ═══════════════════════════════════════════════════════════
  //  SUMMARY
  // ═══════════════════════════════════════════════════════════
  console.log('═══════════════════════════════════════════════');
  console.log(`🎉 Seeded ${totalUsers} users, ${createdMatches.length} matches, ${createdConversations.length} conversations, ${createdMessages.length} messages, ${createdPosts.length} posts, ${createdComments.length} comments, ${createdStories.length} stories, ${createdNotifications.length} notifications`);
  console.log('═══════════════════════════════════════════════');
  console.log('DONE');
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await db.$disconnect();
    process.exit(1);
  });
