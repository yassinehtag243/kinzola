-- ============================================================================
-- KINZOLA - Migration initiale du schema de base de donnees
-- Application de rencontre pour la jeunesse de la RDC (Congo)
-- ============================================================================
-- Ordre : Enums → Tables → Indexes → Fonctions → Triggers → RLS → Storage → Realtime
-- ============================================================================

-- ============================================================================
-- 1. TYPES ENUMERE (creer AVANT les tables)
-- ============================================================================

CREATE TYPE gender AS ENUM ('homme', 'femme');

CREATE TYPE discover_intent AS ENUM ('amitie', 'amour');

CREATE TYPE post_visibility AS ENUM ('public', 'friends');

CREATE TYPE message_type AS ENUM ('text', 'image', 'voice', 'video');

CREATE TYPE notification_type AS ENUM (
  'match',
  'friend_request',
  'love_interest',
  'like',
  'comment_mention',
  'name_change',
  'password_change',
  'badge_obtained'
);

CREATE TYPE report_reason AS ENUM (
  'Faux profil',
  'Harcelement',
  'Contenu inapproprie',
  'Autre'
);


-- ============================================================================
-- 2. TABLES
-- ============================================================================

-- ---------------------------------------------------------------------------
-- profiles : Un profil par utilisateur, lie a auth.users
-- ---------------------------------------------------------------------------
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  phone TEXT DEFAULT '',
  pseudo TEXT NOT NULL,                                     -- Nom d'affichage public
  name TEXT NOT NULL,                                       -- Nom complet (peut etre prive)
  age INTEGER NOT NULL CHECK (age >= 16 AND age <= 99),
  gender gender NOT NULL,
  city TEXT NOT NULL DEFAULT 'Kinshasa',
  profession TEXT DEFAULT '',
  religion TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  photo_url TEXT DEFAULT '',                                -- Photo de profil principale
  photo_gallery TEXT[] DEFAULT '{}',                        -- Galerie de photos (tableau d'URLs)
  verified BOOLEAN DEFAULT false,
  badge_status TEXT DEFAULT 'none' CHECK (badge_status IN (
    'none', 'uploading_id', 'uploading_selfie', 'processing', 'approved', 'rejected'
  )),
  interests TEXT[] DEFAULT '{}',
  online BOOLEAN DEFAULT false,
  last_seen TIMESTAMPTZ DEFAULT now(),
  discover_intent discover_intent DEFAULT 'amour',
  text_size INTEGER DEFAULT 16 CHECK (text_size >= 12 AND text_size <= 24),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- matches : Correspondance entre deux utilisateurs
-- ---------------------------------------------------------------------------
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_super_match BOOLEAN DEFAULT false,
  intent discover_intent DEFAULT 'amour',
  new_match BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user1_id, user2_id),
  CHECK (user1_id != user2_id)
);

-- ---------------------------------------------------------------------------
-- conversations : Une conversation par match
-- ---------------------------------------------------------------------------
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID UNIQUE REFERENCES matches(id) ON DELETE CASCADE,
  participant1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  participant2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_message TEXT DEFAULT '',
  last_message_time TIMESTAMPTZ DEFAULT now(),
  participant1_unread INTEGER DEFAULT 0,
  participant2_unread INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- messages : Messages dans une conversation
-- ---------------------------------------------------------------------------
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  type message_type DEFAULT 'text',
  read BOOLEAN DEFAULT false,
  important BOOLEAN DEFAULT false,
  deleted_for_sender BOOLEAN DEFAULT false,
  deleted_for_receiver BOOLEAN DEFAULT false,
  reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- posts : Publications du fil d'actualite (expiration apres 48h)
-- ---------------------------------------------------------------------------
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  visibility post_visibility DEFAULT 'public',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- post_likes : J'aime sur les publications
-- ---------------------------------------------------------------------------
CREATE TABLE post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  UNIQUE(post_id, user_id)
);

-- ---------------------------------------------------------------------------
-- comments : Commentaires sur les publications
-- ---------------------------------------------------------------------------
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- notifications : Notifications utilisateur
-- ---------------------------------------------------------------------------
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  from_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- blocked_users : Blocage d'utilisateurs
-- ---------------------------------------------------------------------------
CREATE TABLE blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  UNIQUE(blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id)
);

-- ---------------------------------------------------------------------------
-- reports : Signalements d'utilisateurs
-- ---------------------------------------------------------------------------
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason report_reason NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  CHECK (reporter_id != target_id)
);

-- ---------------------------------------------------------------------------
-- custom_nicknames : Surnoms personnalises pour les contacts
-- ---------------------------------------------------------------------------
CREATE TABLE custom_nicknames (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL DEFAULT '',
  UNIQUE(user_id, target_id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);


-- ============================================================================
-- 3. INDEX POUR LA PERFORMANCE
-- ============================================================================

CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_conversations_participant1 ON conversations(participant1_id);
CREATE INDEX idx_conversations_participant2 ON conversations(participant2_id);
CREATE INDEX idx_posts_author_created ON posts(author_id, created_at DESC);
CREATE INDEX idx_posts_expires ON posts(expires_at);
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX idx_matches_user1 ON matches(user1_id);
CREATE INDEX idx_matches_user2 ON matches(user2_id);
CREATE INDEX idx_blocked_users_blocker ON blocked_users(blocker_id);
CREATE INDEX idx_blocked_users_blocked ON blocked_users(blocked_id);
CREATE INDEX idx_reports_reporter ON reports(reporter_id);
CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_post_likes_post ON post_likes(post_id);
CREATE INDEX idx_post_likes_user ON post_likes(user_id);
CREATE INDEX idx_custom_nicknames_user ON custom_nicknames(user_id);
CREATE INDEX idx_custom_nicknames_target ON custom_nicknames(target_id);


-- ============================================================================
-- 4. FONCTIONS
-- ============================================================================

-- ---------------------------------------------------------------------------
-- a) auto_create_profile : Cree automatiquement un profil lors de l'inscription
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.auto_create_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, pseudo, name, age, gender)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      SPLIT_PART(NEW.email, '@', 1),
      'utilisateur'
    ),
    COALESCE(
      SPLIT_PART(NEW.email, '@', 1),
      'Utilisateur'
    ),
    18,
    'homme'
  );
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- b) update_updated_at() : Met a jour le champ updated_at a chaque modification
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- c) cleanup_expired_posts : Supprime les publications expirees
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cleanup_expired_posts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.posts
  WHERE expires_at < now();
END;
$$;

-- ---------------------------------------------------------------------------
-- d) update_conversation_on_message : Met a jour la conversation apres un message
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_conversation_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_conversation RECORD;
  v_receiver_id UUID;
BEGIN
  -- Recuperer les infos de la conversation
  SELECT * INTO v_conversation
  FROM public.conversations
  WHERE id = NEW.conversation_id;

  -- Determiner le destinataire
  IF NEW.sender_id = v_conversation.participant1_id THEN
    v_receiver_id := v_conversation.participant2_id;
    UPDATE public.conversations
    SET
      last_message = NEW.content,
      last_message_time = NEW.created_at,
      participant2_unread = participant2_unread + 1,
      updated_at = now()
    WHERE id = NEW.conversation_id;
  ELSE
    v_receiver_id := v_conversation.participant1_id;
    UPDATE public.conversations
    SET
      last_message = NEW.content,
      last_message_time = NEW.created_at,
      participant1_unread = participant1_unread + 1,
      updated_at = now()
    WHERE id = NEW.conversation_id;
  END IF;

  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- e) notify_on_match : Cree une notification lors d'un nouveau match
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_on_match()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_matcher_pseudo TEXT;
  v_intent_text TEXT;
BEGIN
  -- Recuperer le pseudo de l'utilisateur qui a initie le match
  SELECT pseudo INTO v_matcher_pseudo
  FROM public.profiles
  WHERE id = NEW.user1_id;

  -- Determiner le texte selon l'intention
  IF NEW.intent = 'amitie' THEN
    v_intent_text := 'Vous avez un nouvel ami !';
  ELSE
    v_intent_text := 'Vous avez un nouveau match !';
  END IF;

  -- Creer la notification pour user2
  INSERT INTO public.notifications (user_id, from_user_id, type, title, message)
  VALUES (
    NEW.user2_id,
    NEW.user1_id,
    'match',
    v_intent_text,
    COALESCE(v_matcher_pseudo, 'Quelqu''un') || ' vous a matche !'
  );

  -- Notifier aussi user1
  INSERT INTO public.notifications (user_id, from_user_id, type, title, message)
  VALUES (
    NEW.user1_id,
    NEW.user2_id,
    'match',
    v_intent_text,
    'Vous avez un nouveau match !'
  );

  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- f) notify_on_like_post : Cree une notification lorsqu'un post recoit un like
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_on_like_post()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_liker_pseudo TEXT;
BEGIN
  -- Recuperer le pseudo de celui qui a aime
  SELECT pseudo INTO v_liker_pseudo
  FROM public.profiles
  WHERE id = NEW.user_id;

  -- Creer la notification pour l'auteur du post (seulement si ce n'est pas son propre post)
  IF NEW.user_id != (SELECT author_id FROM public.posts WHERE id = NEW.post_id) THEN
    INSERT INTO public.notifications (user_id, from_user_id, type, title, message)
    VALUES (
      (SELECT author_id FROM public.posts WHERE id = NEW.post_id),
      NEW.user_id,
      'like',
      'Nouveau j''aime',
      COALESCE(v_liker_pseudo, 'Quelqu''un') || ' a aime votre publication.'
    );
  END IF;

  RETURN NEW;
END;
$$;


-- ============================================================================
-- 5. TRIGGERS
-- ============================================================================

-- Trigger : Creation automatique du profil apres inscription
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_profile();

-- Trigger : Mise a jour automatique de updated_at sur les tables concernees
CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER on_conversation_updated
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER on_post_updated
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER on_custom_nickname_updated
  BEFORE UPDATE ON public.custom_nicknames
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Trigger : Mise a jour de la conversation apres l'envoi d'un message
CREATE TRIGGER on_message_sent
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_on_message();

-- Trigger : Notification lors d'un nouveau match
CREATE TRIGGER on_match_created
  AFTER INSERT ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_match();

-- Trigger : Notification lorsqu'un post recoit un like
CREATE TRIGGER on_post_liked
  AFTER INSERT ON public.post_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_like_post();


-- ============================================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Activer RLS sur toutes les tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_nicknames ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- profiles : Tous les utilisateurs peuvent lire, modifier uniquement leur profil
-- ---------------------------------------------------------------------------
CREATE POLICY "Tous peuvent lire les profils"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Les utilisateurs peuvent modifier leur propre profil"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Les utilisateurs peuvent inserer leur propre profil"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- matches : Les utilisateurs peuvent lire et inserer uniquement leurs matchs
-- ---------------------------------------------------------------------------
CREATE POLICY "Lire ses propres matchs"
  ON matches FOR SELECT
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Inserer un match ou l'on est implique"
  ON matches FOR INSERT
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Modifier un match ou l'on est implique"
  ON matches FOR UPDATE
  USING (auth.uid() = user1_id OR auth.uid() = user2_id)
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- ---------------------------------------------------------------------------
-- conversations : Lire uniquement les conversations ou l'on participe
-- ---------------------------------------------------------------------------
CREATE POLICY "Lire ses propres conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = participant1_id OR auth.uid() = participant2_id);

CREATE POLICY "Inserer une conversation ou l'on participe"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = participant1_id OR auth.uid() = participant2_id);

CREATE POLICY "Modifier ses propres conversations"
  ON conversations FOR UPDATE
  USING (auth.uid() = participant1_id OR auth.uid() = participant2_id)
  WITH CHECK (auth.uid() = participant1_id OR auth.uid() = participant2_id);

-- ---------------------------------------------------------------------------
-- messages : Lire les messages de ses conversations, inserer en tant qu'expediteur
-- ---------------------------------------------------------------------------
CREATE POLICY "Lire les messages de ses conversations"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid())
    )
  );

CREATE POLICY "Inserer un message dans ses conversations"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid())
    )
  );

CREATE POLICY "Modifier les messages envoyes"
  ON messages FOR UPDATE
  USING (auth.uid() = sender_id)
  WITH CHECK (auth.uid() = sender_id);

-- ---------------------------------------------------------------------------
-- posts : Les publications publiques sont visibles de tous, les publications
--          friends uniquement entre amis (matchs). Chacun peut creer ses posts.
-- ---------------------------------------------------------------------------
CREATE POLICY "Tous peuvent lire les publications publiques"
  ON posts FOR SELECT
  USING (
    visibility = 'public'
    OR (
      visibility = 'friends'
      AND EXISTS (
        SELECT 1 FROM matches m
        WHERE m.user1_id = auth.uid() AND m.user2_id = posts.author_id
           OR m.user2_id = auth.uid() AND m.user1_id = posts.author_id
      )
    )
    OR author_id = auth.uid()
  );

CREATE POLICY "Creer ses propres publications"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Modifier ses propres publications"
  ON posts FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Supprimer ses propres publications"
  ON posts FOR DELETE
  USING (auth.uid() = author_id);

-- ---------------------------------------------------------------------------
-- post_likes : Les utilisateurs authentifies peuvent liker
-- ---------------------------------------------------------------------------
CREATE POLICY "Tous peuvent voir les likes"
  ON post_likes FOR SELECT
  USING (true);

CREATE POLICY "Les utilisateurs peuvent liker des publications"
  ON post_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent retirer leurs likes"
  ON post_likes FOR DELETE
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- comments : Les utilisateurs authentifies peuvent commenter
-- ---------------------------------------------------------------------------
CREATE POLICY "Tous peuvent voir les commentaires"
  ON comments FOR SELECT
  USING (true);

CREATE POLICY "Les utilisateurs peuvent commenter"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Les utilisateurs peuvent modifier leurs commentaires"
  ON comments FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Les utilisateurs peuvent supprimer leurs commentaires"
  ON comments FOR DELETE
  USING (auth.uid() = author_id);

-- ---------------------------------------------------------------------------
-- notifications : Les utilisateurs lisent leurs propres notifications
-- ---------------------------------------------------------------------------
CREATE POLICY "Lire ses propres notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Inserer des notifications (systeme/triggers)"
  ON notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Modifier ses propres notifications (marquer comme lu)"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- blocked_users : Les utilisateurs gerent leurs propres blocages
-- ---------------------------------------------------------------------------
CREATE POLICY "Lire ses propres blocages"
  ON blocked_users FOR SELECT
  USING (auth.uid() = blocker_id);

CREATE POLICY "Bloquer un utilisateur"
  ON blocked_users FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Debloquer un utilisateur"
  ON blocked_users FOR DELETE
  USING (auth.uid() = blocker_id);

-- ---------------------------------------------------------------------------
-- reports : Les utilisateurs peuvent signaler et voir leurs signalements
-- ---------------------------------------------------------------------------
CREATE POLICY "Lire ses propres signalements"
  ON reports FOR SELECT
  USING (auth.uid() = reporter_id);

CREATE POLICY "Signaler un utilisateur"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- ---------------------------------------------------------------------------
-- custom_nicknames : Les utilisateurs gerent leurs propres surnoms
-- ---------------------------------------------------------------------------
CREATE POLICY "Lire ses propres surnoms"
  ON custom_nicknames FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Creer un surnom"
  ON custom_nicknames FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Modifier ses propres surnoms"
  ON custom_nicknames FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Supprimer ses propres surnoms"
  ON custom_nicknames FOR DELETE
  USING (auth.uid() = user_id);


-- ============================================================================
-- 7. STORAGE - Bucket pour les photos de profil et galeries
-- ============================================================================

-- Creation du bucket de stockage
INSERT INTO storage.buckets (id, name, public)
VALUES ('kinzola-photos', 'kinzola-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Politiques d'acces au bucket
-- Tout le monde peut voir les photos
CREATE POLICY "Les photos sont visibles par tous"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'kinzola-photos');

-- Les utilisateurs authentifies peuvent uploader dans leur propre dossier
CREATE POLICY "Les utilisateurs peuvent uploader leurs propres photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'kinzola-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Les utilisateurs peuvent mettre a jour leurs propres photos
CREATE POLICY "Les utilisateurs peuvent modifier leurs propres photos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'kinzola-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'kinzola-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Les utilisateurs peuvent supprimer leurs propres photos
CREATE POLICY "Les utilisateurs peuvent supprimer leurs propres photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'kinzola-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );


-- ============================================================================
-- 8. REALTIME - Activation du temps reel sur les tables principales
-- ============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE matches;


-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================
-- Pour nettoyer les posts expires, planifier via pg_cron (si disponible) :
--
--   SELECT cron.schedule(
--     'cleanup-expired-posts',
--     '*/10 * * * *',  -- toutes les 10 minutes
--     $$ SELECT cleanup_expired_posts(); $$
--   );
--
-- Ou appeler manuellement : SELECT cleanup_expired_posts();
-- ============================================================================
