// Using i.pravatar.cc to get varied, deterministic avatars.
// The query parameter `u` acts as a seed to get a unique image.

import type { UserRole } from "./types";

export const USER_AVATARS = [
    'https://i.pravatar.cc/150?u=user1',
    'https://i.pravatar.cc/150?u=user2',
    'https://i.pravatar.cc/150?u=user3',
    'https://i.pravatar.cc/150?u=user4',
    'https://i.pravatar.cc/150?u=user5',
    'https://i.pravatar.cc/150?u=user6',
    'https://i.pravatar.cc/150?u=user7',
    'https://i.pravatar.cc/150?u=user8',
    'https://i.pravatar.cc/150?u=user9',
    'https://i.pravatar.cc/150?u=user10',
];

export const INVESTOR_AVATARS = [
    'https://i.pravatar.cc/150?u=investor1',
    'https://i.pravatar.cc/150?u=investor2',
    'https://i.pravatar.cc/150?u=investor3',
    'https://i.pravatar.cc/150?u=investor4',
    'https://i.pravatar.cc/150?u=investor5',
    'https://i.pravatar.cc/150?u=investor6',
    'https://i.pravatar.cc/150?u=investor7',
    'https://i.pravatar.cc/150?u=investor8',
    'https://i.pravatar.cc/150?u=investor9',
    'https://i.pravatar.cc/150?u=investor10',
];

export const ADMIN_AVATARS = [
    'https://i.pravatar.cc/150?u=admin1',
    'https://i.pravatar.cc/150?u=admin2',
    'https://i.pravatar.cc/150?u=admin3',
    'https://i.pravatar.cc/150?u=admin4',
    'https://i.pravatar.cc/150?u=admin5',
    'https://i.pravatar.cc/150?u=admin6',
    'https://i.pravatar.cc/150?u=admin7',
    'https://i.pravatar.cc/150?u=admin8',
    'https://i.pravatar.cc/150?u=admin9',
    'https://i.pravatar.cc/150?u=admin10',
];

export function getRandomAvatar(role: UserRole): string {
    let avatarList: string[];

    switch (role) {
        case 'Investor':
            avatarList = INVESTOR_AVATARS;
            break;
        case 'Admin':
            avatarList = ADMIN_AVATARS;
            break;
        case 'User':
        default:
            avatarList = USER_AVATARS;
            break;
    }

    const randomIndex = Math.floor(Math.random() * avatarList.length);
    return avatarList[randomIndex];
}
