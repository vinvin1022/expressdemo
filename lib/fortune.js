var about = [
        "Conquer your fears or they will conquer you.",
        "Rivers need springs.",
        "Do not fear what you don't know.",
        "You will have a pleasant surprise.",
        "Whenever possible, keep it simple."
    ];
exports.forune = function(){
    var index = Math.floor(Math.random()*about.length);
    return about[index];
}
    