document.addEventListener('DOMContentLoaded', () => {
    const leftText = `function example() {
    console.log("Hello");
    // This is a sample function
    return true;
}`;

    const rightText = `function example() {
    console.log("Hello World");
    // This is an updated function
    return false;
}`;

    // Initialize merge view
    const mv = CodeMirror.MergeView(document.getElementById('merge-view'), {
        value: leftText,
        origLeft: null,
        orig: rightText,
        lineNumbers: true,
        highlightDifferences: true,
        connect: 'align',
        collapseIdentical: false
    });
});
