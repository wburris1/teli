import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Change, EventContext } from 'firebase-functions';
import { DocumentSnapshot, DocumentData, QueryDocumentSnapshot } from 'firebase-admin/firestore';

admin.initializeApp();
const db = admin.firestore();

export const syncSeenListChanges = functions.firestore
  .document('users/{userId}/{listTypeID}/Seen/items/{itemId}')
  .onWrite(async (change: Change<DocumentSnapshot>, context: EventContext) => {
    const { userId, listTypeID, itemId } = context.params;
    const newValue = change.after.exists ? (change.after.data() as UserItem) : null;
    const oldValue = change.before.exists ? (change.before.data() as UserItem) : null;

    console.log("updating backend");
    if (!newValue && oldValue) {
      // Item deleted from Seen list
      await handleItemDeletion(userId, listTypeID, itemId);
    } else if (newValue && oldValue) {
      // Item updated in Seen list
      if (newValue.score !== oldValue.score) {
        await handleItemUpdate(userId, listTypeID, itemId, newValue);
      }
    }

    return null;
  });

async function handleItemDeletion(userId: string, listTypeID: string, itemId: string) {
  const userListsRef = db.collection('users').doc(userId).collection(listTypeID);

  const listsSnapshot = await userListsRef.get();
  const batch = db.batch();

  listsSnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
    const listRef = userListsRef.doc(doc.id).collection('items').doc(itemId);
    batch.delete(listRef);
  });

  await batch.commit();
  console.log(`Item ${itemId} deleted from all lists for user ${userId}`);
}

async function handleItemUpdate(userId: string, listTypeID: string, itemId: string, newValue: UserItem) {
  const userListsRef = db.collection('users').doc(userId).collection(listTypeID);

  const listsSnapshot = await userListsRef.get();
  const batch = db.batch();

  listsSnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
    const listRef = userListsRef.doc(doc.id).collection('items').doc(itemId);
    batch.update(listRef, { score: newValue.score });
  });

  await batch.commit();
  console.log(`Item ${itemId} updated in all lists for user ${userId}`);
}