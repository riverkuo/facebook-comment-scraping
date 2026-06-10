const commentDepth1 = 'Depth1CommentsListPaginationQuery'; // click on 'view replies' in 1st depth to trigger this
const commentDepth2 = 'Depth2CommentsListPaginationQuery'; // click on 'view replies' in 2st depth to trigger this
const postPopup = 'CometSinglePostDialogContentQuery'; // open post modal to trigger this
const commentList = 'CommentListComponentsRootQuery'; // change comment sorting to 'all' to trigger this
const moreComments = 'CommentsListComponentsPaginationQuery'; // scroll down to trigger this

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.status === 'loading' &&
    tab.url &&
    tab.url.includes('facebook.com')
  ) {
    chrome.debugger.attach({ tabId }, '1.3', () => {
      if (chrome.runtime.lastError) {
        return;
      }

      chrome.debugger.sendCommand(
        { tabId },
        'Network.enable'
      );
    });
  }
});

chrome.debugger.onEvent.addListener((source, method, params) => {
  const tabId = source.tabId;

  if (method === 'Network.requestWillBeSent') {
    const request = params.request;
    if (request.url.includes('facebook.com/api/graphql')) {
      let fullPayloadText = '';

      if (
        request.postDataEntries &&
        request.postDataEntries.length > 0
      ) {
        fullPayloadText = request.postDataEntries
          .map(entry => {
            if (entry.bytes) {
              try {
                return atob(entry.bytes);
              } catch (e) {
                return entry.bytes;
              }
            }

            return entry.value || '';
          })
          .join('\n');
      } else {
        fullPayloadText = request.postData || '';
      }

      let requestPrefix = null;

      if (fullPayloadText.includes(commentDepth1)) {
        requestPrefix = 'commentDepth1';
      } else if (fullPayloadText.includes(commentDepth2)) {
        requestPrefix = 'commentDepth2';
      } else if (fullPayloadText.includes(postPopup)) {
        requestPrefix = 'postPopup';
      } else if (fullPayloadText.includes(moreComments)) {
        requestPrefix = 'moreComments';
      } else if (fullPayloadText.includes(commentList)) {
        requestPrefix = 'commentList';
      }

      if (requestPrefix) {
        console.log(
          `🎯 [GraphQL] ${requestPrefix} ${params.requestId}`
        );

        globalThis[`target_${params.requestId}`] =
          requestPrefix;
      }
    }
  }

  if (method === 'Network.loadingFinished') {
    const currentPrefix =
      globalThis[`target_${params.requestId}`];

    if (!currentPrefix) {
      return;
    }

    delete globalThis[`target_${params.requestId}`];

    chrome.debugger.sendCommand(
      { tabId },
      'Network.getResponseBody',
      { requestId: params.requestId },
      responseResult => {
        if (chrome.runtime.lastError) {
          return;
        }

        try {
          const jsonRes = responseResult.body
            .trim()
            .split(/\r?\n/)
            .filter(Boolean)
            .map(line => JSON.parse(line));

          console.log(
            `██████████ Successfully got FB [${currentPrefix}] JSON ██████████`
          );

          if (currentPrefix === 'postPopup') {
            processPostDataFromGraphQL(jsonRes);
          } else if (currentPrefix === 'commentDepth1') {
            processCommentDepth1Data(jsonRes);
          } else if (currentPrefix === 'commentDepth2') {
            processCommentDepth2Data(jsonRes);
          } else if (currentPrefix === 'commentList') {
            processPostCommentSortingComments(jsonRes);
          } else if (currentPrefix === 'moreComments') {
            processMoreCommentsData(jsonRes);
          }
        } catch (e) {
          console.error(
            `[${currentPrefix}] 解析失敗`,
            e
          );
        }
      }
    );
  }
});

function processPostDataFromGraphQL(data) {
  console.log(
    '======= Start of Post Popup Info ======='
  );

  const story = data?.[0]?.data?.node_v2;

  console.log(
    'post actor info',
    story?.comet_sections?.content?.story?.actors
  );

  console.log(
    'post content info',
    story?.comet_sections?.content?.story?.message
  );

  console.log(
    'post visible comments',
    story?.comet_sections?.feedback?.story?.story_ufi_container?.story?.feedback_context?.feedback_target_with_context?.top_level_comments
  );

  console.log(
    '======= End of Post Popup Info ======='
  );
}

function processCommentDepth1Data(data) {
    console.log(
        '======= Start of Comment Depth 1 ======='
    );

    console.log(
        'depth 1 comments',
        data[0].data.node.replies_connection.edges
    );
    // data[0].data.node.replies_connection.edges[0].node.feedback.url -> comment_id & reply_comment_id
    // data[0].data.node.replies_connection.edges[0].node.feedback.replies_connections.edges[0].node
    console.log(
        '======= End of Comment Depth 1 ======='
    );
}

function processCommentDepth2Data(data) {
    console.log(
        '======= Start of Comment Depth 2 ======='
    );

    console.log(
        'depth 2 comments',
        data[0].data.node.replies_connection.edges
    );
    console.log(
        '======= End of Comment Depth 2 ======='
    );
}


function processPostCommentSortingComments(data) {
    console.log(
        '======= Start of All comments ======='
    );
    
    console.log(
        'all comments',
        data[0].data.node.comment_rendering_instance_for_feed_location.comments.edges
    );
    console.log(
        '======= End of All comments ======='
    );
}

function processMoreCommentsData(data) {
  console.log(
    '======= Start of More comments ======='
  );
  
console.log(
    'more comments',
    data[0].data.node.comment_rendering_instance_for_feed_location.comments.edges
);
  console.log(
    '======= End More comments ======='
  );
}