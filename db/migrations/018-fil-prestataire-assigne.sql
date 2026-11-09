-- Le fil démo du prestataire était visible par repli sur tous les fils
-- « prestataire ». On le relie au compte Lucas, sans écraser une affectation
-- déjà posée par un gestionnaire.

update public.conversations
   set assigne = 'lucas.menage@hublify.app'
 where type_interlocuteur = 'prestataire'
   and nom = 'Linge & Entretien'
   and coalesce(assigne, '') = '';
