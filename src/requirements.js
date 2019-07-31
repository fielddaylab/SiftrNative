'use strict';

function evalReqPackage(req, log, instances) {
  for (var i = 0; i < req.ands.length; i++) {
    if (evalReqAndPackage(req.ands[i], log, instances)) return true;
  }
  return false;
}

function evalReqAndPackage(and, log, instances) {
  for (var i = 0; i < and.atoms.length; i++) {
    if (!evalReqAtom(and.atoms[i], log, instances)) return false;
  }
  return true;
}

function playerViewed(atom, type, log) {
  return log.some(logEntry =>
       logEntry.event_type === `VIEW_${type}`
    && logEntry.content_id === atom.content_id
  );
}

function playerHasItem(atom, instances) {
  return instances.some(instance =>
       instance.owner_type === 'USER'
    // && instance.owner_id === (player's user id)
    && instance.object_type === 'ITEM'
    && instance.object_id === atom.content_id
    && instance.qty >= atom.qty
  );
}

function evalReqAtom(atom, log, instances) {
  const bool_operator = !!(atom.bool_operator);
  switch (atom.requirement) {
    case 'ALWAYS_TRUE':
      return bool_operator;
    case 'ALWAYS_FALSE':
      return !bool_operator;
    case 'PLAYER_HAS_ITEM':
      return bool_operator == playerHasItem(atom, instances);
    case 'PLAYER_HAS_TAGGED_ITEM':
      return !bool_operator; // TODO
    case 'GAME_HAS_ITEM':
      return !bool_operator; // TODO
    case 'GAME_HAS_TAGGED_ITEM':
      return !bool_operator; // TODO
    case 'GROUP_HAS_ITEM':
      return !bool_operator; // TODO
    case 'GROUP_HAS_TAGGED_ITEM':
      return !bool_operator; // TODO
    case 'PLAYER_VIEWED_ITEM':
      return bool_operator == playerViewed(atom, 'ITEM', log);
    case 'PLAYER_VIEWED_PLAQUE':
      return bool_operator == playerViewed(atom, 'PLAQUE', log);
    case 'PLAYER_VIEWED_DIALOG':
      return bool_operator == playerViewed(atom, 'DIALOG', log);
    case 'PLAYER_VIEWED_DIALOG_SCRIPT':
      return bool_operator == playerViewed(atom, 'DIALOG_SCRIPT', log);
    case 'PLAYER_VIEWED_WEB_PAGE':
      return bool_operator == playerViewed(atom, 'WEB_PAGE', log);
    case 'PLAYER_RAN_EVENT_PACKAGE':
      return !bool_operator; // TODO
    case 'PLAYER_HAS_UPLOADED_MEDIA_ITEM':
      return !bool_operator; // TODO
    case 'PLAYER_HAS_UPLOADED_MEDIA_ITEM_IMAGE':
      return !bool_operator; // TODO
    case 'PLAYER_HAS_UPLOADED_MEDIA_ITEM_AUDIO':
      return !bool_operator; // TODO
    case 'PLAYER_HAS_UPLOADED_MEDIA_ITEM_VIDEO':
      return !bool_operator; // TODO
    case 'PLAYER_HAS_COMPLETED_QUEST':
      return !bool_operator; // TODO
    case 'PLAYER_HAS_QUEST_STARS':
      return !bool_operator; // TODO
    case 'PLAYER_HAS_RECEIVED_INCOMING_WEB_HOOK':
      return !bool_operator; // TODO
    case 'PLAYER_HAS_NOTE':
      return !bool_operator; // TODO
    case 'PLAYER_HAS_NOTE_WITH_TAG':
      return !bool_operator; // TODO
    case 'PLAYER_HAS_NOTE_WITH_LIKES':
      return !bool_operator; // TODO
    case 'PLAYER_HAS_NOTE_WITH_COMMENTS':
      return !bool_operator; // TODO
    case 'PLAYER_HAS_GIVEN_NOTE_COMMENTS':
      return !bool_operator; // TODO
  }
}
