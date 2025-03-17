import { Devvit } from '@devvit/public-api';
import { UniversalPostHandler } from './components/UniversalPostHandler';

Devvit.configure({
  redditAPI: true,
  redis: true,
});

// Register a single custom post type that handles both sequencer and player
Devvit.addCustomPostType({
  name: 'music_sequencer',
  description: 'Interactive music sequencer that lets you create and play music',
  render: UniversalPostHandler,
  allowedIn: ['post'],
  defaultDimensions: {
    height: 'tall',
  },
});

// Add menu item to create sequencer posts
Devvit.addMenuItem({
  location: 'subreddit',
  label: 'Create Music Sequencer',
  onPress: async (_, context) => {
    try {
      const subreddit = await context.reddit.getCurrentSubreddit();
      const post = await context.reddit.submitPost({
        title: '🎵 Music Sequencer',
        subredditName: subreddit.name,
        preview: (
          <vstack padding="medium" alignment="middle center">
            <text size="xlarge">🎵 Music Sequencer</text>
            <text>Loading your interactive music sequencer...</text>
          </vstack>
        )
      });
      
      // Initialize this as a regular sequencer post
      await context.redis.set(
        `composition:${post.id}`,
        JSON.stringify({
          postId: post.id,
          isMusicPlayer: false,
          createdAt: new Date().toISOString(),
        })
      );
      
      context.ui.showToast('Music sequencer created!');
      context.ui.navigateTo(post.url);
    } catch (error: any) {
      console.error('Failed to create sequencer:', error);
      context.ui.showToast(`Error: ${error?.message || 'Unknown error'}`);
    }
  }
});

export default Devvit;
