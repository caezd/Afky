function main() {
    console.log("Hello, world!");

    new Honey({
        index_box: function (data) {
            console.log(data);
            data.categories[0].forums.forEach(function (forum) {
                console.log(forum);
            });
        },
    });
}
main();
//# sourceMappingURL=commint.esm.js.map
