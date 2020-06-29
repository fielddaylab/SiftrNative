'use strict';

export function evalReqPackage(req, env) {
  const ands = req.ands.map(and => evalReqAndPackage(and, env));
  let bool = ands.length === 0 || ands.some(o => o.bool);
  return {bool: bool, ands: ands, req: req};
}

function evalReqAndPackage(and, env) {
  const atoms = and.atoms.map(atom => evalReqAtom(atom, env));
  let bool = atoms.every(o => o.bool);
  return {bool: bool, atoms: atoms, and: and};
}

function playerViewed(atom, type, log) {
  return log.some(logEntry =>
       logEntry.event_type === `VIEW_${type}`
    && logEntry.content_id === atom.content_id
  );
}

function playerCompletedQuest(atom, log) {
  return log.some(logEntry =>
       logEntry.event_type === 'COMPLETE_QUEST'
    && logEntry.content_id === atom.content_id
  );
}

function playerBeenInPlaqueRange(atom, log) {
  return log.some(logEntry =>
       logEntry.event_type === 'IN_PLAQUE_RANGE'
    && logEntry.content_id === atom.content_id
  );
}

const ITEM_NONE = false;
const ITEM_PICKED_UP = null;
const ITEM_PLACED = true;

function playerHasItem(atom, instances, pickedUpRemnants, onlyNeedPickup) {
  pickedUpRemnants = pickedUpRemnants.map(x => parseInt(x));
  const pickedUpQty = (item_id) => (
    pickedUpRemnants.indexOf(parseInt(item_id)) === -1 ? 0 : 1
  );
  const instance = instances.find(instance =>
       instance.owner_type === 'USER'
    // && instance.owner_id === (player's user id)
    && instance.object_type === 'ITEM'
    && parseInt(instance.object_id) === parseInt(atom.content_id)
  );
  if (!instance) return ITEM_NONE;
  const placed = parseInt(instance.qty);
  const pickedUp = pickedUpQty(instance.object_id);
  const need = parseInt(atom.qty);
  if (onlyNeedPickup) {
    return placed + pickedUp >= need;
  } else {
    if (placed >= need) {
      return ITEM_PLACED;
    } else if (placed + pickedUp >= need) {
      return ITEM_PICKED_UP;
    } else {
      return ITEM_NONE;
    }
  }
}

function playerHasNoteWithQuest(atom, env) {
  const user_id = parseInt(env.auth.authToken.user_id);
  const quest_id = parseInt(atom.content_id);
  const rightUser = note => {
    const note_user_id = parseInt(note.user_id || (note.user && note.user.user_id));
    return note_user_id === user_id || !note_user_id;
  };
  const field_ids = env.fields.filter(field =>
    parseInt(field.quest_id) === quest_id
  ).map(field => parseInt(field.field_id));
  const hasQuest = note => {
    if (!note.field_data) {
      return false;
    } else if (note.field_data.some) {
      return note.field_data.some(field_data =>
        field_ids.indexOf(parseInt(field_data.field_id)) !== -1
      );
    } else {
      for (let field_id in note.field_data) {
        if (field_ids.indexOf(parseInt(field_id)) !== -1) {
          return true;
        }
      }
      return false;
    }
  };
  const qty = env.notes.filter(note => rightUser(note) && hasQuest(note)).length;
  return {
    qty: qty,
    bool: qty >= parseInt(atom.qty),
  };
}

function playerHasNoteWithTag(atom, env) {
  const user_id = parseInt(env.auth.authToken.user_id);
  const tag_id = parseInt(atom.content_id);
  const rightUser = note => {
    const note_user_id = parseInt(note.user_id || (note.user && note.user.user_id));
    return note_user_id === user_id || !note_user_id;
  };
  const hasTag = (tag_id > 10000000) ? (note => {
    if (!note.field_data) {
      return false;
    } else if (note.field_data.some) {
      return note.field_data.some(field_data =>
        parseInt(field_data.field_id) === parseInt(env.game.field_id_pin)
        && parseInt(field_data.field_option_id) === tag_id - 10000000
      );
    } else {
      const field_data = note.field_data[env.game.field_id_pin];
      return parseInt(field_data) === tag_id - 10000000
    }
  }) : (note =>
    false // not implemented
  );
  const qty = env.notes.filter(note => rightUser(note) && hasTag(note)).length;
  return qty >= parseInt(atom.qty);
}

function evalReqAtom(atom, env) {
  let qty = 0;
  const bool = (() => {
    const bool_operator = !!(atom.bool_operator);
    const {log, instances, notes, pickedUpRemnants, quest_id, onlyNeedPickup} = env;
    switch (atom.requirement) {
      case 'ALWAYS_TRUE':
        return bool_operator;
      case 'ALWAYS_FALSE':
        return !bool_operator;
      case 'PLAYER_HAS_ITEM':
        const result = playerHasItem(atom, instances, pickedUpRemnants, onlyNeedPickup);
        if (result === ITEM_PICKED_UP) {
          if (bool_operator) {
            return null; // treated as false but the dot will be half-filled
          } else {
            return true;
          }
        } else {
          return bool_operator == result;
        }
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
        return bool_operator == playerCompletedQuest(atom, log);
      case 'PLAYER_HAS_QUEST_STARS':
        return !bool_operator; // TODO
      case 'PLAYER_HAS_RECEIVED_INCOMING_WEB_HOOK':
        return !bool_operator; // TODO
      case 'PLAYER_HAS_NOTE':
        return !bool_operator; // TODO
      case 'PLAYER_HAS_NOTE_WITH_TAG':
        return bool_operator == playerHasNoteWithTag(atom, env);
      case 'PLAYER_HAS_NOTE_WITH_QUEST': // custom requirement type
        const o = playerHasNoteWithQuest(atom, env);
        qty = o.qty;
        return bool_operator == o.bool;
      case 'PLAYER_IS_IN_QUEST': // custom requirement type
        return bool_operator == (parseInt(quest_id) === parseInt(atom.content_id));
      case 'PLAYER_HAS_NOTE_WITH_LIKES':
        return !bool_operator; // TODO
      case 'PLAYER_HAS_NOTE_WITH_COMMENTS':
        return !bool_operator; // TODO
      case 'PLAYER_HAS_GIVEN_NOTE_COMMENTS':
        return !bool_operator; // TODO
      case 'PLAYER_BEEN_IN_PLAQUE_RANGE':
        return bool_operator == playerBeenInPlaqueRange(atom, log);
    }
  })();
  return {bool: bool, atom: atom, qty: qty};
}
